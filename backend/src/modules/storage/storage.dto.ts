import { IsIn, IsInt, Max, Min } from 'class-validator';

export class CreateUploadDto {
  @IsIn(['image/jpeg', 'image/png', 'image/webp']) mimeType!: string;
  @IsInt() @Min(1) @Max(8_000_000) byteSize!: number;
}
