import { Controller, Post } from "@nestjs/common";
import { CheckinService } from "./checkin.service";

@Controller('cron')
export class CheckinController {
    constructor(private readonly checkinService: CheckinService) {}

    @Post('checkin')
    async triggerCheckin() {
        await this.checkinService.checkUsersForSafety();
        return {success: true};
    }
}