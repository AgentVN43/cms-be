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
exports.PageService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const page_entity_1 = require("./entities/page.entity");
const create_page_dto_1 = require("./dto/create-page.dto");
function slugify(input) {
    return input
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
let PageService = class PageService {
    constructor(pageModel) {
        this.pageModel = pageModel;
    }
    async create(dto) {
        var _a, _b, _c;
        const slug = (dto.slug && dto.slug.trim()) ? slugify(dto.slug) : slugify(dto.title);
        await this.assertDepthWithinLimit(dto.parentId);
        await this.assertUniqueSlug(slug);
        const publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
        const created = await this.pageModel.create({
            title: dto.title,
            slug,
            content: dto.content,
            parentId: dto.parentId ? new mongoose_2.Types.ObjectId(dto.parentId) : null,
            order: (_a = dto.order) !== null && _a !== void 0 ? _a : 0,
            status: (_b = dto.status) !== null && _b !== void 0 ? _b : create_page_dto_1.PageStatus.Draft,
            showInSitemap: (_c = dto.showInSitemap) !== null && _c !== void 0 ? _c : true,
            publishedAt,
        });
        return created.toObject();
    }
    async findAll(params) {
        var _a, _b;
        const page = Math.max(1, Number((_a = params.page) !== null && _a !== void 0 ? _a : 1));
        const limit = Math.min(100, Math.max(1, Number((_b = params.limit) !== null && _b !== void 0 ? _b : 20)));
        const filter = {};
        if (params.q)
            filter.title = { $regex: params.q, $options: 'i' };
        if (typeof params.parentId !== 'undefined') {
            filter.parentId = params.parentId ? new mongoose_2.Types.ObjectId(params.parentId) : null;
        }
        if (params.status)
            filter.status = params.status;
        const [items, total] = await Promise.all([
            this.pageModel
                .find(filter)
                .sort({ parentId: 1, order: 1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            this.pageModel.countDocuments(filter),
        ]);
        return { items, total, page, limit };
    }
    async findOne(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.BadRequestException('INVALID_ID');
        const page = await this.pageModel.findById(id).lean();
        if (!page)
            throw new common_1.NotFoundException('PAGE_NOT_FOUND');
        return page;
    }
    async findPublicBySlug(slug) {
        const now = new Date();
        const page = await this.pageModel
            .findOne({
            slug: slugify(slug),
            status: create_page_dto_1.PageStatus.Published,
            $or: [{ publishedAt: null }, { publishedAt: { $lte: now } }],
        })
            .lean();
        if (!page)
            throw new common_1.NotFoundException('PAGE_NOT_FOUND');
        return page;
    }
    async update(id, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.BadRequestException('INVALID_ID');
        const update = {};
        if (dto.title !== undefined)
            update.title = dto.title;
        if (dto.slug !== undefined) {
            const newSlug = dto.slug ? slugify(dto.slug) : undefined;
            if (newSlug)
                await this.assertUniqueSlug(newSlug, id);
            update.slug = newSlug;
        }
        if (dto.content !== undefined)
            update.content = dto.content;
        if (dto.parentId !== undefined) {
            await this.assertDepthWithinLimit(dto.parentId, id);
            update.parentId = dto.parentId ? new mongoose_2.Types.ObjectId(dto.parentId) : null;
        }
        if (dto.order !== undefined)
            update.order = dto.order;
        if (dto.status !== undefined)
            update.status = dto.status;
        if (dto.showInSitemap !== undefined)
            update.showInSitemap = dto.showInSitemap;
        if (dto.publishedAt !== undefined)
            update.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
        const updated = await this.pageModel.findByIdAndUpdate(id, update, { new: true }).lean();
        if (!updated)
            throw new common_1.NotFoundException('PAGE_NOT_FOUND');
        return updated;
    }
    async remove(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.BadRequestException('INVALID_ID');
        const hasChild = await this.pageModel.exists({ parentId: new mongoose_2.Types.ObjectId(id) });
        if (hasChild)
            throw new common_1.BadRequestException('PAGE_HAS_CHILDREN');
        const res = await this.pageModel.findByIdAndDelete(id).lean();
        if (!res)
            throw new common_1.NotFoundException('PAGE_NOT_FOUND');
        return { ok: true };
    }
    async adminSearch(q, limit = 10) {
        const items = await this.pageModel
            .find({ title: { $regex: q !== null && q !== void 0 ? q : '', $options: 'i' } })
            .sort({ title: 1 })
            .limit(Math.min(50, Math.max(1, Number(limit))))
            .select({ _id: 1, title: 1, slug: 1, status: 1 })
            .lean();
        return items;
    }
    async assertUniqueSlug(slug, excludeId) {
        const filter = { slug };
        if (excludeId && mongoose_2.Types.ObjectId.isValid(excludeId)) {
            filter._id = { $ne: new mongoose_2.Types.ObjectId(excludeId) };
        }
        const exists = await this.pageModel.exists(filter);
        if (exists)
            throw new common_1.BadRequestException('DUPLICATE_SLUG');
    }
    async assertDepthWithinLimit(parentId, selfId) {
        if (!parentId)
            return;
        if (!mongoose_2.Types.ObjectId.isValid(parentId))
            throw new common_1.BadRequestException('INVALID_PARENT_ID');
        if (selfId && parentId === selfId)
            throw new common_1.BadRequestException('MENU_CYCLE_DETECTED');
        let depth = 1;
        let current = await this.pageModel.findById(parentId).select({ parentId: 1 }).lean();
        const visited = new Set([parentId]);
        while (current === null || current === void 0 ? void 0 : current.parentId) {
            const pid = String(current.parentId);
            if (visited.has(pid))
                throw new common_1.BadRequestException('MENU_CYCLE_DETECTED');
            visited.add(pid);
            depth++;
            if (depth >= 3)
                break;
            current = await this.pageModel.findById(current.parentId).select({ parentId: 1 }).lean();
        }
        if (depth >= 3)
            throw new common_1.BadRequestException('MENU_DEPTH_EXCEEDED');
    }
};
PageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(page_entity_1.Page.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], PageService);
exports.PageService = PageService;
//# sourceMappingURL=page.service.js.map