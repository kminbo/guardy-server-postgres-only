import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class LoginDto {
    @ApiProperty({ description: '닉네임' })
    @IsString()
    @IsNotEmpty()
    nickname: string;

    @ApiProperty({ description: '비밀번호' })
    @IsString()
    @IsNotEmpty()
    password: string;
}