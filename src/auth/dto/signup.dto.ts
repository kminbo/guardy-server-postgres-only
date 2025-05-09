import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsInt, IsOptional } from "class-validator";

export class SignupDto {
    @ApiProperty({ description: '닉네임' })
    @IsString()
    @IsNotEmpty()
    nickname: string;

    @ApiProperty({ description: '전화번호' })
    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @ApiProperty({ description: '국적' })
    @IsString()
    @IsNotEmpty()
    nationality: string;

    @ApiProperty({ description: '생년' })
    @IsInt()
    @IsNotEmpty()
    birthYear: number;

    @ApiProperty({ description: '언어' })
    @IsString()
    @IsNotEmpty()
    language: string;

    @ApiProperty({ description: '성별' })
    @IsString()
    @IsNotEmpty()
    sex: string;

    @ApiProperty({ description: '질병/장애' })
    @IsString()
    @IsOptional()
    difficulties?: string;

    @ApiProperty({ description: '긴급 연락처 이름' })
    @IsString()
    @IsNotEmpty()
    emContactName: string;

    @ApiProperty({ description: '긴급 연락처 번호' })
    @IsString()
    @IsNotEmpty()
    emContactNumber: string;

    @ApiProperty({ description: '비밀번호' })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiPropertyOptional({ description: 'FCM 토큰' })
    @IsString()
    @IsOptional()
    fcmToken?: string;
}
