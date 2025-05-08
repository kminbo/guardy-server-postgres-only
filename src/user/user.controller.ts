import { Controller, Patch, UseGuards, Request, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Patch('profile')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '유저 프로필 수정' })
    async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
        const userId = req.user.userId;   //jwt 토큰에서 유저 아이디 추출
        await this.userService.updateProfile(userId, updateProfileDto);
        return {success: true};
    }
}
