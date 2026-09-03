import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { apiResponse } from '../../common/api';
import { AppUserGuard } from '../auth/app-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateReportDto } from './social.dto';
import { SocialService } from './social.service';

@ApiTags('social')
@ApiBearerAuth()
@UseGuards(AppUserGuard)
@Controller()
export class SocialController {
  constructor(private readonly social: SocialService) {}
  @Post('social/follows/:userId') follow(
    @CurrentUser() user: User,
    @Param('userId') target: string,
  ) {
    return this.social.follow(user.id, target).then(apiResponse);
  }
  @Delete('social/follows/:userId') unfollow(
    @CurrentUser() user: User,
    @Param('userId') target: string,
  ) {
    return this.social.unfollow(user.id, target).then(apiResponse);
  }
  @Post('social/list-likes/:listId') like(
    @CurrentUser() user: User,
    @Param('listId') listId: string,
  ) {
    return this.social.like(user.id, listId).then(apiResponse);
  }
  @Delete('social/list-likes/:listId') unlike(
    @CurrentUser() user: User,
    @Param('listId') listId: string,
  ) {
    return this.social.unlike(user.id, listId).then(apiResponse);
  }
  @Post('blocks/:userId') block(
    @CurrentUser() user: User,
    @Param('userId') target: string,
  ) {
    return this.social.block(user.id, target).then(apiResponse);
  }
  @Delete('blocks/:userId') unblock(
    @CurrentUser() user: User,
    @Param('userId') target: string,
  ) {
    return this.social.unblock(user.id, target).then(apiResponse);
  }
  @Post('reports') report(
    @CurrentUser() user: User,
    @Body() dto: CreateReportDto,
  ) {
    return this.social.report(user.id, dto).then(apiResponse);
  }
}
