import { ResponseBuilder } from '@app/common/utils/dto';
import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/api/hello')
  getHello() {
    return ResponseBuilder.createResponse({
      data: this.appService.getHello(),
    });
  }
}
