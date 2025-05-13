import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ChangeModeDto } from 'src/danger/dto/change-mode.dto';
import { HttpService } from '@nestjs/axios';
import { async, firstValueFrom } from 'rxjs';
import { DangerService } from 'src/danger/danger.service';
import { Twilio } from 'twilio';
import { google } from 'googleapis';

@Injectable()
export class SafetyService {
    private readonly logger = new Logger(SafetyService.name);
    private readonly twilioClient = new Twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
    )

    constructor(
        private readonly prisma: PrismaService, 
        private readonly httpService: HttpService,
        private readonly dangerService: DangerService,
    ) {}

    async getAccessToken() {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        return accessToken.token;
    }

    async changeMode(userId: string, dto: ChangeModeDto) {
        const { mode } = dto;

        //모드 변경 시 안전 단계, 긴급 연락처 알림 활성화 여부 초기화
        if (mode === 'safe') {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    mode: 'safe',
                    nextCheckinTime: new Date(Date.now() + 1000 * 60 * 60 * 6), //6시간 후
                    safetyStage: 1,
                    isEmergencyActive: false,
                },
            });
        } else if (mode === 'sleeping') {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    mode: 'sleeping',
                    nextCheckinTime: null,
                    safetyStage: 1,
                    isEmergencyActive: false,
                },
            });
        }

        return { success: true };
    }

    //사용자가 안전 확인 알림에 응답했을 때 안전 단계, isEmergencyActive 초기화, lastCheckinTime, nextCheckinTime 업데이트
    async checkin(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                safetyStage: 1,
                lastCheckinTime: new Date(),
                nextCheckinTime: new Date(Date.now() + 1000 * 60 * 60 * 6), //6시간 후
                isEmergencyActive: false,
            },
        });

        return {success: true};
    }

    //현재 모드 및 안전 단계 조회
    async getStatus(userId: string): Promise<{mode: string, safetyStage: number, lastCheckinTime: Date | null}> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                mode: true,
                safetyStage: true,
                lastCheckinTime: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    //주기적 위치 업데이트
    async updateLocation(userId: string, dto: UpdateLocationDto) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                lastLatitude: dto.latitude,
                lastLongitude: dto.longitude,
                lastUpdatedAt: new Date(dto.lastUpdatedAt),
            },
        });

        return {success: true};
    }

    //수동 안전 확인 알림 트리거
    async triggerManualCheckin(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (user === null) {
            throw new NotFoundException('User not found');
        }

        if (user.mode === 'sleeping') {
            throw new BadRequestException('User is in sleeping mode');
        }


        //FCM 전송 로직 
        if (!user.fcmToken){
            this.logger.warn(`No fcm token for user ${user.nickname}`);
            return {success: false};
        }

        const title = '🔔 수동 긴급 안전 알림';
        const body = '긴급 안전 알림이 트리거되었습니다. 즉시 응답해 주세요.';

        try {
            const accessToken = await this.getAccessToken();

            await firstValueFrom(this.httpService.post(
                'https://fcm.googleapis.com/v1/projects/titanium-gantry-458811-s3/messages:send',
                {
                    message: {
                        token: user.fcmToken,
                        notification: {
                            title: title,
                            body: body,
                        },
                        data: {
                            stage: 'manual_checkin',
                        },
                    }
                },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            },
            ));
        } catch (error) {
            this.logger.error('Error sending manual checkin FCM notification:', error.response?.data?.error?.message ?? error.message);
            return {success: false};
        }

        this.logger.log(`MANUAL FCM notification sent to ${user.nickname} (stage: ${user.safetyStage})`);

        return {success: true};
    }

    //안전 확인 체크 알림 보내기
    //이 함수는 BullMQ에서 주기적으로(5분마다) 호출됨
    async handleSafetyCheck(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        
        if (!user) return;
        if (user.mode === 'sleeping') return;

        const now = new Date();
        const elapsedTime = now.getTime() - (user.lastCheckinTime?.getTime() || 0);
        const elapsedHours = elapsedTime / (1000 * 60 * 60);


        //6시간 지났으면 1단계 체크인 알림
        if (user.safetyStage === 1 && elapsedHours >= 6) {
            await this.sendSafetyPush(user, 1);
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    safetyStage: 2,
                },
            });
        }
        else if (user.safetyStage === 2 && elapsedHours >= 7) {
            //1시간 추가 경과(7시간) -> 2단계 체크인 알림
            await this.sendSafetyPush(user, 2);
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    safetyStage: 3,
                },
            });
        }
        else if (user.safetyStage === 3 && elapsedHours >= 7.5) {
            //30분 추가 경과(7.5시간) -> 3단계 체크인 알림
            await this.sendSafetyPush(user, 3);

            // 15분 후에 긴급 연락처 알림 전송
            setTimeout(async () => {
                const updatedUser = await this.prisma.user.findUnique({ where: { id: userId } });
                if (updatedUser && updatedUser.safetyStage === 3) {
                    await this.alertEmergencyContacts(updatedUser);
                    await this.prisma.user.update({
                        where: { id: userId },
                        data: {
                            isEmergencyActive: true,
                            nextCheckinTime: null,
                            },
                    });
                }
            }, 15 * 60 * 1000);
        }
    }

    //안전 확인 알림 실제 전송
    private async sendSafetyPush(user: any, stage: number) {
        if (!user.fcmToken){
            this.logger.warn(`No fcm token for user ${user.nickname}`);
            return;
        }

        const {title, body} = this.getSafetyMessage(user, stage);

        await firstValueFrom(this.httpService.post(
            'https://fcm.googleapis.com/fcm/send',
            {
                to: user.fcmToken,
                notification: {
                    title: title,
                    body: body,
                },
                data: {
                    stage: stage.toString(),
                },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `key=${process.env.FCM_SERVER_KEY}`,
                },
            },
        ));

        this.logger.log(`FCM notification sent to ${user.nickname} (stage: ${stage})`);
    }

        // 안전 알림 메시지 생성
        private getSafetyMessage(user: any, stage: number) {
            const { nickname, language } = user;
    
            if (language === 'ko') {
                if (stage === 1) {
                    return { title: `🔔 ${nickname}님, 잘 지내고 계신가요?`, body: '여행은 즐겁게 하고 계신가요?...' };
                } else if (stage === 2) {
                    return { title: `⏰ ${nickname}님, 괜찮으세요?`, body: '아직 답변이 없어서 다시 한 번 연락드려요...' };
                } else {
                    return { title: `🚨 ${nickname}님, 긴급 확인이 필요합니다!`, body: '오랫동안 응답이 없어 걱정돼요...' };
                }
            } else {
                if (stage === 1) {
                    return { title: `🔔 Hey ${nickname}, just checking in!`, body: "You've been out there exploring..." };
                } else if (stage === 2) {
                    return { title: `⏰ Still there, ${nickname}?`, body: "Just checking again - haven't heard back yet..." };
                } else {
                    return { title: `🚨 Urgent: please respond, ${nickname}`, body: "We're worried since we haven't heard..." };
                }
            }
        }
    
        // 비상연락처 메시지 전송
        private async alertEmergencyContacts(user: any) {
            try {
                const { emContactNumber, emContactName, nickname, language, lastLatitude, lastLongitude, lastUpdatedAt } = user;

                //주소 변환 
                let address = `(${lastLatitude}, ${lastLongitude})`;
                if (lastLatitude && lastLongitude) {
                    try {
                        if (language === 'ko') {
                            address = await this.dangerService.getKoreanAddressFromCoordinates(lastLatitude, lastLongitude);
                        }
                        else {
                            address = await this.dangerService.getAddressFromCoordinates(lastLatitude, lastLongitude);
                        }
                    } catch (error) {
                        this.logger.error('Error getting address:', error);
                        //주소 가져오는데 실패하면 좌표 그대로 사용
                    }
                }
                
                // 시간 포맷 변환: MM/DD HH:mm(UTC)
                let formattedTime = '';
                if (lastUpdatedAt) {
                    const date = new Date(lastUpdatedAt);
                    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                    const day = date.getUTCDate().toString().padStart(2, '0');
                    const hours = date.getUTCHours().toString().padStart(2, '0');
                    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
                    formattedTime = `${month}/${day} ${hours}:${minutes}(UTC)`;
                }
                this.logger.debug(`Formatted time: ${formattedTime}`);

                let messageBody = '';
                let timePhrase = formattedTime ? `, 시간은 ${formattedTime}` : '';

                if (language === 'ko') {
                    messageBody = `긴급 안전 알림: ${nickname}님이 여러 번의 안전 확인 요청에 응답하지 않고 있습니다. 마지막 확인 위치는 ${address}${timePhrase}입니다. 도움이 필요할 수 있으니, 즉시 연락해 주세요. 본 알림은 Guardy 안전 앱에서 자동 전송되었습니다.`
                } else {
                    messageBody = `URGENT SAFETY ALERT: ${nickname} has not responded to multiple safety checks on Guardy. Their last known location was ${address} at ${formattedTime}. They may need assistance. This is an automated message from Guardy Safety App. Please attempt to contact them immediately.`
                }

                if (!emContactNumber.startsWith('+')) {
                    this.logger.error('Emergency contact number must be in international format (e.g., +82...).');
                    throw new Error('Emergency contact number must be in international format (e.g., +82...).');
                }

                await this.twilioClient.messages.create({   
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: emContactNumber,
                    body: messageBody,
                });

                this.logger.log(`SMS sent to ${emContactName} (${emContactNumber}) for user ${nickname}`);
            } catch (error) {
                this.logger.error('Error sending emergency SMS:', error);
                // 에러를 상위로 전파하지 않고 로깅만 하고 종료
                // 이렇게 하면 Twilio 전송 실패가 전체 서비스에 영향을 주지 않음
            }
        }
}