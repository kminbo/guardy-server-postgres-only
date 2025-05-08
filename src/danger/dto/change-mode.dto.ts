import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsIn } from "class-validator";

export class ChangeModeDto {
    @ApiProperty({description: '모드(safe / sleeping'})
    @IsString()
    @IsIn(['safe', 'sleeping'])
    mode: string;
}
