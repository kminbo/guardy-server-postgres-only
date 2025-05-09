import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SafetyService } from "src/safety/safety.service";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class CheckinService {
    constructor(
        private readonly prisma: PrismaService, 
        private readonly safetyService: SafetyService,
    ) {}

    @Cron('*/5 * * * *')  // This cron expression means every 5 minutes
    async checkUsersForSafety() {
        const now = new Date();

        const users = await this.prisma.user.findMany({
            where: {
                mode: 'safe',
                isEmergencyActive: false,
                nextCheckinTime: {lte: now}, //다음 체크인 시간(nextCheckinTime)이 현재 시간보다 이전인 사용자
            },
        });

        for (const user of users) {
            //조회된 각 사용자에 대해 SafetyService의 handleSafetyCheck 메소드를 호출하여 안전 체크를 수행
            await this.safetyService.handleSafetyCheck(user.id); 
        }
    }
    
}
