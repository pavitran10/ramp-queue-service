import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { BullModule } from '@nestjs/bull';
import { UploadProcessor } from './processors/upload.processor';

@Module({
  controllers: [UploadController],
  providers: [UploadProcessor],
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    BullModule.registerQueue({
      name: 'upload-queue',
    }),
  ],
})
export class UploadModule {}
