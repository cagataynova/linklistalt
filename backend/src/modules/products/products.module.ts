import { Module } from '@nestjs/common';
import { OptionalUserGuard } from '../auth/optional-user.guard';
import { ExtractionModule } from '../extraction/extraction.module';
import { StorageModule } from '../storage/storage.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [StorageModule, ExtractionModule],
  controllers: [ProductsController],
  providers: [ProductsService, OptionalUserGuard],
})
export class ProductsModule {}
