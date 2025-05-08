import { Controller, Get, Post, Query, UseGuards, Body, Req } from '@nestjs/common';
import { DangerService } from './danger.service';
import { GetLocationDto } from './dto/get-location.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { ChangeModeDto } from './dto/change-mode.dto';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request';

@ApiTags('Danger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('danger')
export class DangerController {
    constructor(private readonly dangerService: DangerService) {}

    @Post('info')
    @ApiOperation({ summary: '1km 이동 시 위험 정보 조회' })
    async getDangerInfo(@Body() dto: GetLocationDto, @Req() req: AuthenticatedRequest) {
        const userId = req.user.userId;
        return this.dangerService.getDangerInfo(userId, dto);
    }

    @Post('location')
    @ApiOperation({ summary: '현위치 반환' })
    async getLocation(@Body() dto: GetLocationDto, @Req() req: AuthenticatedRequest) {
        const userId = req.user.userId;
        return this.dangerService.getLocationName(userId, dto);
    }


}