import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) {}

    async signup(signupDto: SignupDto) {
        const hashedPassword = await bcrypt.hash(signupDto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                nickname: signupDto.nickname,
                phoneNumber: signupDto.phoneNumber,
                nationality: signupDto.nationality,
                birthYear: signupDto.birthYear,
                language: signupDto.language,
                sex: signupDto.sex,
                difficulties: signupDto.difficulties,
                emContactName: signupDto.emContactName,
                emContactNumber: signupDto.emContactNumber,
                password: hashedPassword,
            },
        });

        return {message: true};
    }

    async login(loginDto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { nickname: loginDto.nickname },
        });

        if (!user) {
            throw new Error('존재하지 않는 사용자입니다.');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

        if (!isPasswordValid) {
            throw new Error('비밀번호가 일치하지 않습니다.');
        }

        const payload = { userId: user.id };
        const token = this.jwtService.sign(payload);

        return {
            success: true,
            token,
            nickname: user.nickname,
            phoneNumber: user.phoneNumber,
            nationality: user.nationality,
            birthYear: user.birthYear,
            language: user.language,
            sex: user.sex,
            difficulties: user.difficulties,
            emContactName: user.emContactName,
            emContactNumber: user.emContactNumber,
        };        
    }

    async validate(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }

        return {
            success: true,
            nickname: user.nickname,
            phoneNumber: user.phoneNumber,
            nationality: user.nationality,
            birthYear: user.birthYear,
            language: user.language,
            sex: user.sex,
            difficulties: user.difficulties,
            emContactName: user.emContactName,
            emContactNumber: user.emContactNumber,
        };
    }
}