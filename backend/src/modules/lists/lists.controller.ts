import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { apiResponse } from '../../common/api';
import { AppUserGuard } from '../auth/app-user.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalUserGuard } from '../auth/optional-user.guard';
import { CreateListDto, UpdateListDto } from './lists.dto';
import { ListsService } from './lists.service';

@ApiTags('lists')
@Controller()
export class ListsController {
  constructor(private readonly lists: ListsService) {}
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Get('me/dashboard') dashboard(
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
  ) {
    return this.lists
      .dashboard(user.id, cursor)
      .then(({ me, lists }) =>
        apiResponse(
          { me, lists: lists.slice(0, 20) },
          { nextCursor: lists.length > 20 ? lists[19].id : null },
        ),
      );
  }
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Get('lists') mine(
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
  ) {
    return this.lists.listMine(user.id, cursor).then((rows) =>
      apiResponse(rows.slice(0, 20), {
        nextCursor: rows.length > 20 ? rows[19].id : null,
      }),
    );
  }
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Post('lists') create(
    @CurrentUser() user: User,
    @Body() dto: CreateListDto,
  ) {
    return this.lists.create(user.id, dto).then(apiResponse);
  }
  @UseGuards(OptionalUserGuard) @Get('lists/:id') find(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.lists.find(id, request.appUser).then(apiResponse);
  }
  @Get('shared/lists/:token') shared(@Param('token') token: string) {
    return this.lists.findShared(token).then(apiResponse);
  }
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Patch('lists/:id') update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateListDto,
  ) {
    return this.lists.update(user.id, id, dto).then(apiResponse);
  }
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Delete('lists/:id') async remove(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.lists.remove(user.id, id);
    return apiResponse({ deleted: true });
  }
}
