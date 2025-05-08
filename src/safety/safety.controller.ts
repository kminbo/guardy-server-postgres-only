import { Controller, UseGuards, Post, Req, Body, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { SafetyService } from './safety.service';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ChangeModeDto } from 'src/danger/dto/change-mode.dto';

@ApiTags('Safety')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('safety')
export class SafetyController {
    constructor(private readonly safetyService: SafetyService) {}

    @Post('mode')
    @ApiOperation({ summary: '모드 변경(safe/sleeping)' })
    async changeMode(@Body() dto: ChangeModeDto, @Req() req: AuthenticatedRequest) {
        const userId = req.user.userId;
        return this.safetyService.changeMode(userId, dto);
    }

    @Post('checkin')
    @ApiOperation({summary: '사용자 안전 확인 응답'})
    async checkin(@Req() req: AuthenticatedRequest) {
        const userId = req.user.userId;
        return this.safetyService.checkin(userId);
    }

    @Get('status')
    @ApiOperation({summary: '현재 모드 및 안전 단계 조회'})
    async getStatus(@Req() req: AuthenticatedRequest) {
        const userId = req.user.userId;
        return this.safetyService.getStatus(userId);
    }

    @Post('location')
    @ApiOperation({summary: '주기적 위치 업데이트'})
    async updateLocation(@Body() dto: UpdateLocationDto, @Req() req: AuthenticatedRequest) {
        const userId = req.user.userId;
        return this.safetyService.updateLocation(userId, dto);
    }

    @Post('trigger')
    @ApiOperation({summary: '수동으로 안전 확인 알림 트리거'})
    async triggerManualCheckin(@Req() req: AuthenticatedRequest) {
        const userId = req.user.userId;
        return this.safetyService.triggerManualCheckin(userId);
    }
}
