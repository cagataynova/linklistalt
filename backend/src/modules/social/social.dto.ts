import { ReportTargetType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateReportDto {
  @IsEnum(ReportTargetType) targetType!: ReportTargetType;
  @IsString() @Length(1, 100) targetId!: string;
  @IsString() @Length(3, 100) reason!: string;
  @IsOptional() @IsString() @MaxLength(1000) details?: string;
}
