import { ListVisibility } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateListDto {
  @IsString() @Length(1, 100) title!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsString() @Length(1, 50) category!: string;
  @IsEnum(ListVisibility) visibility: ListVisibility = ListVisibility.PRIVATE;
}

export class UpdateListDto {
  @IsOptional() @IsString() @Length(1, 100) title?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() @Length(1, 50) category?: string;
  @IsOptional() @IsEnum(ListVisibility) visibility?: ListVisibility;
}
