import { Controller, Get, Req, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body } from '@nestjs/common';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiOperation({ summary: '회원가입' })
    @ApiResponse({ status: 201, description: '회원가입 성공' })
    @Post('signup')
    async signup(@Body() signupDto: SignupDto) {
        return this.authService.signup(signupDto);
    }

    @ApiOperation({ summary: '로그인' })
    @ApiResponse({ status: 200, description: '로그인 성공 및 토큰 반환' })
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: '자동로그인(토큰 검증)' })
    @ApiResponse({ status: 200, description: '유저 정보 반환' })
    @UseGuards(JwtAuthGuard)
    @Get('validate')
    async validate(@Req() req: AuthenticatedRequest) {
        const userId = req.user.userId;
        return this.authService.validate(userId);
    }
}
