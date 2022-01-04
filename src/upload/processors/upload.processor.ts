import {
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job } from 'bull';
import * as xlxs from 'xlsx';
import { request, gql } from 'graphql-request';
import { StudentUpload } from '../entities/student-upload.entity';
import { Logger } from '@nestjs/common';

@Processor('upload-queue')
export class UploadProcessor {
  private logger: Logger = new Logger(UploadProcessor.name);

  @Process('xlsx')
  async handleCsvFiles(job: Job) {
    this.logger.log('xlsx process');
    const excelFilePath = process.cwd() + '/' + job.data.file.path;

    const x = xlxs.readFile(excelFilePath);
    const y = x.Sheets['student'];
    const studentArray = xlxs.utils.sheet_to_json(y, { raw: false });

    const studentUploadParameters = Object.keys(StudentUpload);

    if (studentArray.length) {
      for (const i of studentUploadParameters) {
        if (!studentArray[0].hasOwnProperty(i)) {
          this.logger.error(`Data from Excel File don't have ${i} property`);
        }
      }
    }

    const object = {
      createStudentsBulkInput: studentArray,
    };

    const endpoint =
      'http://' +
      process.env.GRAPHQL_HOST +
      ':' +
      process.env.GRAPHQL_PORT +
      '/graphql';

    const createStudentsBulk = gql`
      mutation createStudentsBulk(
        $createStudentsBulkInput: [CreateStudentInput!]!
      ) {
        createStudentsBulk(createStudentsBulkInput: $createStudentsBulkInput) {
          id
          name
          gender
          address
          dob
          age
        }
      }
    `;

    await request(endpoint, createStudentsBulk, object);
  }

  // @OnQueueCompleted({ name: 'csv' })
  // async handleCsvFilesSuccessed(job: Job) {
  //   console.log('Successed')
  //   return 'Passed'
  // }

  // @OnQueueFailed({ name: 'csv'})
  // async handleCsvFilesFailed(job: Job) {
  //   console.log('Failed')
  //   return 'Failed'
  // }
}
