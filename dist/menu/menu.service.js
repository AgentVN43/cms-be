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
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const menu_entity_1 = require("./entities/menu.entity");
const create_menu_dto_1 = require("./dto/create-menu.dto");
const page_entity_1 = require("../page/entities/page.entity");
function isValidHttpUrl(url) {
    try {
        const u = new URL(url);
        return u.protocol === 'http:' || u.protocol === 'https:';
    }
    catch (_a) {
        return false;
    }
}
let MenuService = class MenuService {
    constructor(model, blogModel, pageModel) {
        this.model = model;
        this.blogModel = blogModel;
        this.pageModel = pageModel;
    }
    async assertDepthWithinLimit(parentId, selfId) {
        if (!parentId)
            return;
        if (!mongoose_2.Types.ObjectId.isValid(parentId))
            throw new common_1.BadRequestException('INVALID_PARENT_ID');
        if (selfId && parentId === selfId)
            throw new common_1.BadRequestException('MENU_CYCLE_DETECTED');
        let depth = 1;
        const visited = new Set([parentId]);
        let current = await this.model
            .findById(parentId)
            .select({ parentId: 1 })
            .lean();
        while (current === null || current === void 0 ? void 0 : current.parentId) {
            const pid = String(current.parentId);
            if (visited.has(pid))
                throw new common_1.BadRequestException('MENU_CYCLE_DETECTED');
            visited.add(pid);
            depth++;
            if (depth >= 3)
                break;
            current = await this.model
                .findById(current.parentId)
                .select({ parentId: 1 })
                .lean();
        }
        if (depth >= 3)
            throw new common_1.BadRequestException('MENU_DEPTH_EXCEEDED');
    }
    applyPublicFilters(base) {
        const nowMs = Date.now();
        return Object.assign(Object.assign({}, base), { status: create_menu_dto_1.MenuStatus.Published, $or: [{ publishedAt: null }, { publishedAt: { $lte: nowMs } }] });
    }
    buildSort(sort) {
        switch (sort) {
            case 'order_asc':
                return { parentId: 'asc', order: 'asc' };
            case 'createdAt_desc':
                return { createdAt: 'desc' };
            case 'publishedAt_desc':
            default:
                return { publishedAt: 'desc', createdAt: 'desc' };
        }
    }
    buildHref(type, targetSlug, url) {
        if (type === 'custom')
            return url !== null && url !== void 0 ? url : '#';
        if (type === 'post')
            return targetSlug ? `/posts/${targetSlug}` : '#';
        if (type === 'page')
            return targetSlug ? `/pages/${targetSlug}` : '#';
        return '#';
    }
    async create(dto) {
        var _a, _b;
        if (typeof dto.parentId !== 'undefined') {
            await this.assertDepthWithinLimit((_a = dto.parentId) !== null && _a !== void 0 ? _a : null, undefined);
        }
        if (dto.type === 'post' || dto.type === 'page') {
            if (!dto.targetId)
                throw new common_1.BadRequestException('targetId required');
            const targetDoc = (await (dto.type === 'post'
                ? this.blogModel.findById(dto.targetId).select({ slug: 1 }).lean()
                : this.pageModel
                    .findById(dto.targetId)
                    .select({ slug: 1 })
                    .lean()));
            if (!targetDoc)
                throw new common_1.BadRequestException('TARGET_NOT_FOUND');
            const targetSlug = String((_b = targetDoc.slug) !== null && _b !== void 0 ? _b : '')
                .trim()
                .toLowerCase();
            const doc = await this.model.create(Object.assign(Object.assign({}, dto), { targetId: (targetDoc === null || targetDoc === void 0 ? void 0 : targetDoc._id) instanceof mongoose_2.Types.ObjectId
                    ? targetDoc._id
                    : new mongoose_2.Types.ObjectId(dto.targetId), url: null, targetSlug, slug: this.buildHref(dto.type, targetSlug, null) }));
            return doc.toObject();
        }
        if (!dto.url)
            throw new common_1.BadRequestException('url required');
        if (!isValidHttpUrl(dto.url))
            throw new common_1.BadRequestException('INVALID_URL');
        const doc = await this.model.create(Object.assign(Object.assign({}, dto), { targetId: null, targetSlug: null, slug: dto.url }));
        return doc.toObject();
    }
    async findAllPublic(q, parentId, page = 1, limit = 20, sort) {
        const filter = {};
        if (q)
            filter.label = { $regex: q, $options: 'i' };
        if (typeof parentId !== 'undefined') {
            filter.parentId = parentId ? new mongoose_2.Types.ObjectId(parentId) : null;
        }
        const finalFilter = this.applyPublicFilters(filter);
        const [items, total] = await Promise.all([
            this.model
                .find(finalFilter)
                .sort(this.buildSort(sort))
                .skip(Math.max(0, (page - 1) * Math.max(1, limit)))
                .limit(Math.max(1, limit))
                .lean(),
            this.model.countDocuments(finalFilter),
        ]);
        return { items, total, page, limit };
    }
    async searchPublic(q = '', limit = 10) {
        const filter = this.applyPublicFilters({
            label: { $regex: q, $options: 'i' },
        });
        const items = await this.model
            .find(filter)
            .sort({ order: 1, createdAt: -1 })
            .limit(Math.min(50, Math.max(1, +limit)))
            .select({ label: 1, slug: 1 })
            .lean();
        return items;
    }
    async findPublicById(id) {
        const finalFilter = this.applyPublicFilters({
            _id: new mongoose_2.Types.ObjectId(id),
        });
        const item = await this.model.findOne(finalFilter).lean();
        if (!item)
            throw new common_1.NotFoundException('MENU_NOT_FOUND');
        return item;
    }
    async findPublicByHref(href) {
        const finalFilter = this.applyPublicFilters({ slug: href });
        const item = await this.model.findOne(finalFilter).lean();
        if (!item)
            throw new common_1.NotFoundException('MENU_NOT_FOUND');
        return item;
    }
    async findAllAdmin(q, parentId, status, page = 1, limit = 20, sort) {
        const filter = {};
        if (q)
            filter.label = { $regex: q, $options: 'i' };
        if (typeof parentId !== 'undefined') {
            filter.parentId = parentId ? new mongoose_2.Types.ObjectId(parentId) : null;
        }
        if (status)
            filter.status = status;
        const [items, total] = await Promise.all([
            this.model
                .find(filter)
                .sort(this.buildSort(sort))
                .skip(Math.max(0, (page - 1) * Math.max(1, limit)))
                .limit(Math.max(1, limit))
                .lean(),
            this.model.countDocuments(filter),
        ]);
        return { items, total, page, limit };
    }
    async adminSearch(q = '', limit = 10) {
        const items = await this.model
            .find({ label: { $regex: q, $options: 'i' } })
            .sort({ order: 1, createdAt: -1 })
            .limit(Math.min(50, Math.max(1, +limit)))
            .select({ label: 1, slug: 1 })
            .lean();
        return items;
    }
    async findOneAdmin(id) {
        const item = await this.model.findById(id).lean();
        if (!item)
            throw new common_1.NotFoundException('MENU_NOT_FOUND');
        return item;
    }
    async update(id, dto) {
        var _a, _b, _c, _d, _e;
        const item = await this.model.findById(id);
        if (!item)
            throw new common_1.NotFoundException('MENU_NOT_FOUND');
        if (typeof dto.parentId !== 'undefined') {
            await this.assertDepthWithinLimit((_a = dto.parentId) !== null && _a !== void 0 ? _a : null, String(item._id));
        }
        const next = Object.assign({}, dto);
        const nextType = (_b = dto.type) !== null && _b !== void 0 ? _b : item.type;
        if (nextType === 'post' || nextType === 'page') {
            const targetId = (_c = dto.targetId) !== null && _c !== void 0 ? _c : item.targetId;
            if (!targetId)
                throw new common_1.BadRequestException('targetId required');
            const resolvedTarget = (await (nextType === 'post'
                ? this.blogModel.findById(targetId).select({ slug: 1 }).lean()
                : this.pageModel.findById(targetId).select({ slug: 1 }).lean()));
            if (!resolvedTarget)
                throw new common_1.BadRequestException('TARGET_NOT_FOUND');
            const resolvedId = (resolvedTarget === null || resolvedTarget === void 0 ? void 0 : resolvedTarget._id) instanceof mongoose_2.Types.ObjectId
                ? resolvedTarget._id
                : targetId instanceof mongoose_2.Types.ObjectId
                    ? targetId
                    : new mongoose_2.Types.ObjectId(String(targetId));
            const targetSlug = String((_d = resolvedTarget === null || resolvedTarget === void 0 ? void 0 : resolvedTarget.slug) !== null && _d !== void 0 ? _d : '')
                .trim()
                .toLowerCase();
            next.type = nextType;
            next.targetId = resolvedId;
            next.targetSlug = targetSlug;
            next.url = null;
            next.slug = this.buildHref(nextType, targetSlug, null);
        }
        else if (nextType === 'custom') {
            const url = (_e = dto.url) !== null && _e !== void 0 ? _e : item.url;
            if (!url)
                throw new common_1.BadRequestException('url required');
            if (!isValidHttpUrl(url))
                throw new common_1.BadRequestException('INVALID_URL');
            next.type = 'custom';
            next.url = url;
            next.targetId = null;
            next.targetSlug = null;
            next.slug = url;
        }
        Object.assign(item, next);
        await item.save();
        return item.toObject();
    }
    async remove(id) {
        const hasChild = await this.model.exists({
            parentId: new mongoose_2.Types.ObjectId(id),
        });
        if (hasChild)
            throw new common_1.BadRequestException('MENU_HAS_CHILDREN');
        const res = await this.model.findByIdAndDelete(id).lean();
        if (!res)
            throw new common_1.NotFoundException('MENU_NOT_FOUND');
        return { ok: true };
    }
};
MenuService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(menu_entity_1.Menu.name)),
    __param(1, (0, mongoose_1.InjectModel)('Blog')),
    __param(2, (0, mongoose_1.InjectModel)(page_entity_1.Page.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], MenuService);
exports.MenuService = MenuService;
//# sourceMappingURL=menu.service.js.map