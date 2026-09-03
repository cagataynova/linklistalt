import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class ClaimInviteDto {
  @IsString() @Length(6, 64) code!: string;
}

export class BootstrapDto {
  @IsString() @Length(32, 256) signupTicket!: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @Matches(/^[a-z0-9][a-z0-9_-]{2,29}$/)
  username!: string;
  @IsString() @Length(2, 80) displayName!: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @Length(2, 80) displayName?: string;
  @IsOptional() @IsString() @MaxLength(280) bio?: string;
  @IsOptional() @IsString() @MaxLength(2048) avatarUrl?: string;
}

export class CreateInviteDto {
  @IsOptional() @IsString() @MaxLength(80) label?: string;
  @IsOptional() maxUses?: number;
  @IsOptional() @IsString() expiresAt?: string;
}

export class EmailDto {
  @IsEmail() email!: string;
}
