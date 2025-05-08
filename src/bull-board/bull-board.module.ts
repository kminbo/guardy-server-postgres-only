import { Module } from '@nestjs/common';
import { BullBoardService } from './bull-board.service';

@Module({
  providers: [BullBoardService],
})
export class BullBoardModule {}