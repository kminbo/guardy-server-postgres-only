import { Module } from '@nestjs/common';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';
import { HttpModule } from '@nestjs/axios';
import { DangerModule } from '../danger/danger.module';
@Module({
  imports: [HttpModule, DangerModule],
  controllers: [SafetyController],
  providers: [SafetyService]
})
export class SafetyModule {}
