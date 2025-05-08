import { Processor, WorkerHost } from '@nestjs/bullmq';
import { SafetyService } from './safety.service';
import { Job } from 'bullmq';

@Processor('safety-check')
export class SafetyCheckProcessor extends WorkerHost {
    constructor(private readonly safetyService: SafetyService) {
        super();
    }

    async process(job: Job<{userId: string}>) {
        const { userId } = job.data;
        await this.safetyService.handleSafetyCheck(userId);
    }
}