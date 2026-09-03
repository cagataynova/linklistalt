import { Type } from 'class-transformer';
import {
  IsArray,
  IsISO4217CurrencyCode,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ProductImageInputDto {
  @IsOptional() @IsUUID() uploadId?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  sourceUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) altText?: string;
}

export class CreateProductDto {
  @IsUUID() listId!: string;
  @IsString() @Length(1, 160) name!: string;
  @IsOptional() @IsString() @MaxLength(100) brand?: string;
  @IsOptional() @Matches(/^\d{1,10}(?:\.\d{1,2})?$/) price?: string;
  @IsISO4217CurrencyCode() currency: string = 'TRY';
  @IsUrl({ protocols: ['https'], require_protocol: true }) sourceUrl!: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images: ProductImageInputDto[] = [];
}

export class UpdateProductDto {
  @IsOptional() @IsString() @Length(1, 160) name?: string;
  @IsOptional() @IsString() @MaxLength(100) brand?: string;
  @IsOptional() @Matches(/^\d{1,10}(?:\.\d{1,2})?$/) price?: string;
  @IsOptional() @IsISO4217CurrencyCode() currency?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  sourceUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class ExtractProductDto {
  @IsUrl({ protocols: ['https'], require_protocol: true }) url!: string;
}
export class CloneProductDto {
  @IsUUID() targetListId!: string;
}
