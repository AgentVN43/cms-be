"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const category_entity_1 = require("./entities/category.entity");
let CategoryService = class CategoryService {
    constructor(categoryModel) {
        this.categoryModel = categoryModel;
    }
    normaliseParentId(parentId) {
        if (parentId === undefined || parentId === null) {
            return null;
        }
        const trimmed = `${parentId}`.trim();
        return trimmed.length === 0 ? null : trimmed;
    }
    async resolveHierarchy(parentId, currentId) {
        const normalisedParentId = this.normaliseParentId(parentId);
        if (!normalisedParentId) {
            return { parentId: null, ancestors: [], depth: 0 };
        }
        const parent = await this.categoryModel.findById(normalisedParentId);
        if (!parent) {
            throw new common_1.BadRequestException('Parent category not found');
        }
        if (parent.depth >= 2) {
            throw new common_1.BadRequestException('Maximum category depth (3 levels) exceeded');
        }
        if (currentId && parent._id.equals(currentId)) {
            throw new common_1.BadRequestException('Category cannot be its own parent');
        }
        if (currentId && parent.ancestors.some((ancestorId) => ancestorId.equals(currentId))) {
            throw new common_1.BadRequestException('Cannot set a child category as parent');
        }
        return {
            parentId: parent._id,
            ancestors: [...parent.ancestors, parent._id],
            depth: parent.depth + 1,
        };
    }
    async createCategory(createCategoryDto, authorId) {
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
    async findAll() {
        return this.categoryModel.find().sort({ depth: 1, name: 1 }).lean();
    }
    async findOne(id) {
        const category = await this.categoryModel.findById(id).lean();
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }
    async updateDescendants(root, ancestors, depth) {
        const children = await this.categoryModel.find({ parentId: root._id });
        for (const child of children) {
            child.ancestors = [...ancestors, root._id];
            child.depth = depth + 1;
            await child.save();
            await this.updateDescendants(child, child.ancestors, child.depth);
        }
    }
    async updateCategory(id, updateDto) {
        const category = await this.categoryModel.findById(id);
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${id} not found`);
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
    async deleteCategory(id) {
        const category = await this.categoryModel.findById(id);
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${id} not found`);
        }
        const hasChildren = await this.categoryModel.exists({ parentId: category._id });
        if (hasChildren) {
            throw new common_1.BadRequestException('Cannot delete category that has child categories');
        }
        await category.deleteOne();
        return category;
    }
};
CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(category_entity_1.Category.name)),
    __metadata("design:paramtypes", [mongoose_1.Model])
], CategoryService);
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map