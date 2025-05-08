import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Queue, RepeatOptions } from "bullmq";
import Redis from "ioredis";
import { RepeatableJob } from "bullmq";

@Injectable()
export class SafetyCheckQueue {
    private queue: Queue;

    constructor() {
        if (!process.env.REDIS_URL) {
            throw new Error('REDIS_URL is not defined');
        }

        this.queue = new Queue('safety-check', {
            connection: new Redis(process.env.REDIS_URL, {
                maxRetriesPerRequest: 3,
                enableReadyCheck: true
            }),
        });
    }

    async addJob(userId: string) {
        await this.queue.add('check-safety', { userId }, {
            jobId: userId,  //유저당 하나만 유지
            repeat: {
                every: 1000 * 60 * 5, //5분마다
            },
            removeOnComplete: true,
            removeOnFail: true,
        });
    }



    // async removeJob(userId: string) {
    //     const repeat = await this.queue.repeat;
    //     const repeatableJobs = await repeat.getRepeatableJobs();
    
    //     const job = repeatableJobs.find(job => job.id === userId);
    
    //     if (job) {
    //         await repeat.removeRepeatableByKey(job.key);
    //     } else {
    //         console.warn(`[SafetyCheckQueue] No repeatable job found for user ${userId}`);
    //     }
    // }

    async removeJob(userId: string) {
        const repeat = await this.queue.repeat;
        const jobs = await repeat.getRepeatableJobs();
    
        const expectedJobId = `check-safety-${userId}`;
    
        for (const job of jobs) {
            if (job.name === 'check-safety' && job.key.includes(expectedJobId)) {
                await repeat.removeRepeatableByKey(job.key);
                console.log(`[SafetyCheckQueue] Removed repeatable job for user ${userId}`);
                return;
            }
        }
    
        console.warn(`[SafetyCheckQueue] No repeatable job found for user ${userId}`);
    }
    
    
    
}