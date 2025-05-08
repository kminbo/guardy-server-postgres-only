import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

import { IsString } from "class-validator";

export class UpdateLocationDto {
    @ApiProperty({description: '위도'})
    @IsNumber()
    @IsNotEmpty()
    latitude: number;

    @ApiProperty({description: '경도'})
    @IsNumber()
    @IsNotEmpty()
    longitude: number;

    @ApiProperty({description: '업데이트 시각(ISO 포맷 문자열, UTC 시간)', example: '2023-01-01T00:00:00.000Z'})
    @IsString()
    @IsNotEmpty()
    lastUpdatedAt: string;
}
