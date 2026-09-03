import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { ProductExtractionService } from '../extraction/product-extraction.service';
import {
  CloneProductDto,
  CreateProductDto,
  ExtractProductDto,
  UpdateProductDto,
} from './products.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly extraction: ProductExtractionService,
  ) {}
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Post('extract') extract(
    @Body() dto: ExtractProductDto,
  ) {
    return this.extraction.extract(dto.url).then(apiResponse);
  }
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Post() create(
    @CurrentUser() user: User,
    @Body() dto: CreateProductDto,
  ) {
    return this.products.create(user.id, dto).then(apiResponse);
  }
  @UseGuards(OptionalUserGuard) @Get(':id') find(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.products.find(id, request.appUser).then(apiResponse);
  }
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Patch(':id') update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(user.id, id, dto).then(apiResponse);
  }
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Post(':id/clone') clone(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CloneProductDto,
  ) {
    return this.products.clone(user.id, id, dto.targetListId).then(apiResponse);
  }
  @ApiBearerAuth() @UseGuards(AppUserGuard) @Delete(':id') async remove(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.products.remove(user.id, id);
    return apiResponse({ deleted: true });
  }
}
