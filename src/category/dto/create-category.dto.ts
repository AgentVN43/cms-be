import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsOptional()
  @IsMongoId({ message: 'parentId must be a valid MongoId' })
  readonly parentId?: string;
}
