import { Module } from '@nestjs/common';
import { ProductExtractionService } from './product-extraction.service';

@Module({
  providers: [ProductExtractionService],
  exports: [ProductExtractionService],
})
export class ExtractionModule {}
