import {
  Controller,
  Logger,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Response } from 'express';

@Controller('/api/students')
export class UploadController {
  constructor(@InjectQueue('upload-queue') private fileQueue: Queue) {}

  private logger: Logger = new Logger(UploadController.name);

  @Post('/upload')
  @UseInterceptors(
    FileInterceptor('xlsx', {
      storage: diskStorage({
        destination: './xlsx',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadCsv(@Res() response: Response, @UploadedFile() file) {
    this.logger.log('UploadCsv Api');
    const attemp = 3;

    await this.fileQueue.add(
      'xlsx',
      { file: file },
      {
        attempts: attemp, // If job fails it will retry till 5 times
        backoff: 5000, // static 5 sec delay between retry
      },
    );

    this.fileQueue.on('completed', () => {
      this.fileQueue.removeAllListeners();
      return response.send({
        message: 'All Students Details Uploaded',
        status: true,
      });
    });

    let count = 0;
    this.fileQueue.on('failed', () => {
      count++;
      if (count >= attemp) {
        this.fileQueue.removeAllListeners();
        return response.send({
          message: 'Unable To Uploads Student Details',
          status: false,
        });
      }
    });
  }
}
