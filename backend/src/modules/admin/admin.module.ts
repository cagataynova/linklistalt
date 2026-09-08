import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SystemStatusService } from './system-status.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, SystemStatusService],
})
export class AdminModule {}
