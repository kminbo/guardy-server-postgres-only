import { Module } from '@nestjs/common';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';
import { SafetyCheckQueue } from './safety-check.queue';
import { BullBoardService } from '../bull-board/bull-board.service';
import { HttpModule } from '@nestjs/axios';
import { DangerModule } from '../danger/danger.module';
@Module({
  imports: [HttpModule, DangerModule],
  controllers: [SafetyController],
  providers: [SafetyService, SafetyCheckQueue, BullBoardService]
})
export class SafetyModule {}
