import {
  ModerationActionType,
  ReportStatus,
  ReportTargetType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import {
  IsEnum,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class AdminCreateInviteDto {
  @IsOptional() @IsString() @MaxLength(80) label?: string;
  @IsInt() @Min(1) @Max(10_000) maxUses: number = 10;
  @IsOptional() @IsDateString() expiresAt?: string;
}
export class ModerateDto {
  @IsEnum(ReportTargetType) targetType!: ReportTargetType;
  @IsString() targetId!: string;
  @IsEnum(ModerationActionType) action!: ModerationActionType;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
  @IsOptional() @IsString() reportId?: string;
  @IsOptional() @IsEnum(ReportStatus) reportStatus?: ReportStatus;
}
export class UpdateUserStatusDto {
  @IsEnum(UserStatus) status!: UserStatus;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole) role!: UserRole;
}
