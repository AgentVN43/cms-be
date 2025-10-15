import { IsBoolean, IsEnum, IsMongoId, IsOptional, IsString, MaxLength, Min, IsInt } from 'class-validator';

export enum PageStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

export class CreatePageDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  // optional; nếu không truyền sẽ tự generate từ title
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsString()
  content!: string;

  // phân cấp trang: optional
  @IsOptional()
  @IsMongoId()
  parentId?: string | null;

  // thứ tự hiển thị trong cùng parent
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number = 0;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus = PageStatus.Draft;

  @IsOptional()
  @IsBoolean()
  showInSitemap?: boolean = true;

  // đặt lịch xuất bản (ISO string) – optional
  @IsOptional()
  @IsString()
  publishedAt?: string;
}
