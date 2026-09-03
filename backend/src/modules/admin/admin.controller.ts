import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole, type User } from '@prisma/client';
import { apiResponse } from '../../common/api';
import { AppUserGuard } from '../auth/app-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles, RolesGuard } from '../auth/roles';
import {
  AdminCreateInviteDto,
  ModerateDto,
  UpdateUserStatusDto,
} from './admin.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AppUserGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Roles(UserRole.ADMIN) @Post('invites') createInvite(
    @CurrentUser() user: User,
    @Body() dto: AdminCreateInviteDto,
  ) {
    return this.admin.createInvite(user, dto).then(apiResponse);
  }
  @Get('invites') invites() {
    return this.admin.listInvites().then(apiResponse);
  }
  @Get('moderation') reports(@Query('status') status?: string) {
    return this.admin.listReports(status).then(apiResponse);
  }
  @Post('moderation/actions') moderate(
    @CurrentUser() user: User,
    @Body() dto: ModerateDto,
  ) {
    return this.admin.moderate(user, dto).then(apiResponse);
  }
  @Get('users') users(@Query('cursor') cursor?: string) {
    return this.admin.listUsers(cursor).then(apiResponse);
  }
  @Roles(UserRole.ADMIN) @Patch('users/:id/status') updateUser(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.admin.updateUser(user, id, dto).then(apiResponse);
  }
}
