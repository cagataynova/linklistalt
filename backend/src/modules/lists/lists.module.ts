import { Module } from '@nestjs/common';
import { OptionalUserGuard } from '../auth/optional-user.guard';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';

@Module({
  controllers: [ListsController],
  providers: [ListsService, OptionalUserGuard],
  exports: [ListsService],
})
export class ListsModule {}
