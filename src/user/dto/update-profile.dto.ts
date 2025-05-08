import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional } from "class-validator";

export class UpdateProfileDto {
    @ApiPropertyOptional({ description: '닉네임' })
    @IsString()
    @IsOptional()
    nickname?: string;

    @ApiPropertyOptional({ description: '전화번호' })
    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @ApiPropertyOptional({ description: '국적' })
    @IsString()
    @IsOptional()
    nationality?: string;

    @ApiPropertyOptional({ description: '생년' })
    @IsNumber()
    @IsOptional()
    birthYear?: number;

    @ApiPropertyOptional({ description: '언어' })
    @IsString()
    @IsOptional()
    language?: string;

    @ApiPropertyOptional({ description: '성별' })
    @IsString()
    @IsOptional()
    sex?: string;

    @ApiPropertyOptional({ description: '질병/장애' })
    @IsString()
    @IsOptional()
    difficulties?: string;

    @ApiPropertyOptional({ description: '긴급 연락처 이름' })
    @IsString()
    @IsOptional()
    emContactName?: string;

    @ApiPropertyOptional({ description: '긴급 연락처 번호' })
    @IsString()
    @IsOptional()
    emContactNumber?: string;

    @ApiPropertyOptional({ description: '비밀번호' })
    @IsString()
    @IsOptional()
    password?: string;
}