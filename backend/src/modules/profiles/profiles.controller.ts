import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { apiResponse } from '../../common/api';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}
  @Get(':username') find(@Param('username') username: string) {
    return this.profiles.findPublic(username).then(apiResponse);
  }
}
