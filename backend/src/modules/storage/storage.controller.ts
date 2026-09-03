import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { apiResponse } from '../../common/api';
import { AppUserGuard } from '../auth/app-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateUploadDto } from './storage.dto';
import { StorageService } from './storage.service';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(AppUserGuard)
@Controller('uploads')
export class StorageController {
  constructor(private readonly storage: StorageService) {}
  @Post() create(@CurrentUser() user: User, @Body() dto: CreateUploadDto) {
    return this.storage.createIntent(user.id, dto).then(apiResponse);
  }
  @Post(':id/finalize') finalize(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.storage.finalize(user.id, id).then(apiResponse);
  }
}
