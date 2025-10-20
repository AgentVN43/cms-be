import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  private normaliseParentId(parentId?: string | null) {
    if (parentId === undefined || parentId === null) {
      return null;
    }
    const trimmed = `${parentId}`.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private async resolveHierarchy(parentId?: string | null, currentId?: Types.ObjectId) {
    const normalisedParentId = this.normaliseParentId(parentId);

    if (!normalisedParentId) {
      return { parentId: null, ancestors: [], depth: 0 };
    }

    const parent = await this.categoryModel.findById(normalisedParentId);
    if (!parent) {
      throw new BadRequestException('Parent category not found');
    }

    if (parent.depth >= 2) {
      throw new BadRequestException('Maximum category depth (3 levels) exceeded');
    }

    if (currentId && parent._id.equals(currentId)) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    if (currentId && parent.ancestors.some((ancestorId) => ancestorId.equals(currentId))) {
      throw new BadRequestException('Cannot set a child category as parent');
    }

    return {
      parentId: parent._id,
      ancestors: [...parent.ancestors, parent._id],
      depth: parent.depth + 1,
    };
  }

  async createCategory(createCategoryDto: CreateCategoryDto, authorId: string) {
    const hierarchy = await this.resolveHierarchy(createCategoryDto.parentId);

    const category = new this.categoryModel({
      name: createCategoryDto.name,
      author: authorId,
      parentId: hierarchy.parentId,
      ancestors: hierarchy.ancestors,
      depth: hierarchy.depth,
    });

    return category.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().sort({ depth: 1, name: 1 }).lean();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).lean();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category as Category;
  }

  private async updateDescendants(root: CategoryDocument, ancestors: Types.ObjectId[], depth: number) {
    const children = await this.categoryModel.find({ parentId: root._id });

    for (const child of children) {
      child.ancestors = [...ancestors, root._id];
      child.depth = depth + 1;
      await child.save();
      await this.updateDescendants(child, child.ancestors, child.depth);
    }
  }

  async updateCategory(id: string, updateDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (updateDto.name) {
      category.name = updateDto.name;
    }

    if (typeof updateDto.parentId !== 'undefined') {
      const hierarchy = await this.resolveHierarchy(updateDto.parentId, category._id);
      category.parentId = hierarchy.parentId;
      category.ancestors = hierarchy.ancestors;
      category.depth = hierarchy.depth;
      await this.updateDescendants(category, category.ancestors, category.depth);
    }

    await category.save();
    return category;
  }

  async deleteCategory(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const hasChildren = await this.categoryModel.exists({ parentId: category._id });
    if (hasChildren) {
      throw new BadRequestException('Cannot delete category that has child categories');
    }

    await category.deleteOne();
    return category;
  }
}
