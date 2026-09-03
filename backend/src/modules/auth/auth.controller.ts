import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { apiResponse } from '../../common/api';
import { AppUserGuard } from './app-user.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';
import { BootstrapDto, ClaimInviteDto, UpdateProfileDto } from './auth.dto';
import { CurrentUser } from './current-user.decorator';
import { IdentityGuard } from './identity.guard';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('invites/ticket') claim(@Body() dto: ClaimInviteDto) {
    return this.auth.claimInvite(dto.code).then(apiResponse);
  }
  @ApiBearerAuth() @UseGuards(IdentityGuard) @Post('auth/bootstrap') bootstrap(
    @Req() request: AuthenticatedRequest,
    @Body() dto: BootstrapDto,
  ) {
    return this.auth.bootstrap(request.identity, dto).then(apiResponse);
  }
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Get('me') me(
    @CurrentUser() user: User,
  ) {
    return this.auth.getMe(user.id).then(apiResponse);
  }
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Patch('me/profile') update(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.auth.updateProfile(user.id, dto).then(apiResponse);
  }
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Delete('me') async remove(
    @CurrentUser() user: User,
  ) {
    await this.auth.deleteAccount(user);
    return apiResponse({ deleted: true });
  }
}
