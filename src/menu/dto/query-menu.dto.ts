import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { MenuStatus } from './create-menu.dto';

export class QueryMenuDto {
  @IsOptional() @IsString() q?: string;

  @IsOptional() @IsMongoId() parentId?: string;

  @IsOptional() @IsEnum(MenuStatus) status?: MenuStatus;

  @IsOptional() @IsNumber() @Min(1) page?: number = 1;

  @IsOptional() @IsNumber() @Min(1) @Max(100) limit?: number = 20;

  // allowed: 'createdAt_desc' | 'order_asc' | 'publishedAt_desc'
  @IsOptional() @IsString() sort?: string = 'publishedAt_desc';
}
