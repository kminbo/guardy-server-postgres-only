import { Injectable, OnModuleInit } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { Server } from 'http';
import * as express from 'express';
import Redis from 'ioredis';

@Injectable()
export class BullBoardService implements OnModuleInit {
  private server: Server;

  async onModuleInit() {
    const app = express();

    // 연결할 Queue 정의
    const safetyQueue = new Queue('safety-check', {
      connection: new Redis(process.env.REDIS_URL || 'redis://localhost:6379'),
    });

    // ExpressAdapter 세팅
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [new BullMQAdapter(safetyQueue)],
      serverAdapter,
    });

    app.use('/admin/queues', serverAdapter.getRouter());

    // 별도로 대시보드 서버 띄우기
    const port = 3001;
    this.server = app.listen(port, () => {
      console.log(`Bull Board running at http://localhost:${port}/admin/queues`);
    });
  }
}
