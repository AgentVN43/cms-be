// dto/settings.dto.ts
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class GeneralSettingsDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  siteName!: string;

  @IsString() @IsOptional() @MaxLength(200)
  slogan?: string;

  @IsString() @IsOptional() @MaxLength(300)
  description?: string;

  @IsString() @IsOptional()
  logoMediaId?: string | null;

  @IsEmail()
  adminEmail!: string;

  @IsString() @IsOptional()
  faviconMediaId?: string | null;
}

export class ReadingSettingsDto {
  @IsInt() @Min(1) @Max(100)
  postsPerPage!: number;

  @IsInt() @Min(0) @Max(20)
  relatedPosts!: number;
}

export class UpdateSettingsDto {
  @ValidateNested() @Type(() => GeneralSettingsDto)
  general!: GeneralSettingsDto;

  @ValidateNested() @Type(() => ReadingSettingsDto)
  reading!: ReadingSettingsDto;

  // Cho phép mở rộng có kiểm soát
  @IsObject() @IsOptional()
  extra?: Record<string, any>;
}

export class PublicSettingsDto {
  // Chỉ những thứ FE cần công khai
  general!: Pick<GeneralSettingsDto, 'siteName'|'slogan'|'description'|'logoMediaId'|'faviconMediaId'>;
  reading!: ReadingSettingsDto;
}
