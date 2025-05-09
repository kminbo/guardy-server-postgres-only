import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { SafetyModule } from "src/safety/safety.module";
import { CheckinService } from "./checkin.service";

@Module({
    imports: [SafetyModule, PrismaModule],
    providers: [CheckinService]     
})
export class CheckinModule {}