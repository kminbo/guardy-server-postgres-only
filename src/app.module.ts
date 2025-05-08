import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SafetyModule } from './safety/safety.module';
import { DangerModule } from './danger/danger.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { BullBoardModule } from './bull-board/bull-board.module';

@Module({
  imports: [AuthModule, UserModule, SafetyModule, DangerModule, PrismaModule, RedisModule, BullBoardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
