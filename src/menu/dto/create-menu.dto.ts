import { IsArray, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, MaxLength, Min, IsIn } from 'class-validator';

export enum MenuStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

export enum MenuType {
  Post = 'post',
  Page = 'page',
  Custom = 'custom',
}

export class CreateMenuDto {
  @IsString()
  @MaxLength(200)
  label!: string;

  @IsEnum(MenuType)
  type!: MenuType; // 'post' | 'page' | 'custom'

  // OPTIONALS
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string; // optional slug snapshot

  @IsOptional()
  @IsMongoId()
  targetId?: string; // when type = post/page

  @IsOptional()
  @IsString()
  url?: string; // when type = custom

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number = 0;

  @IsOptional()
  @IsMongoId()
  parentId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibleRoles?: string[];

  @IsOptional()
  @IsEnum(MenuStatus)
  status?: MenuStatus = MenuStatus.Draft;

  // timestamp (ms). Nếu không truyền, coi như chưa lên lịch xuất bản
  @IsOptional()
  @IsNumber()
  publishedAt?: number | null;
}
