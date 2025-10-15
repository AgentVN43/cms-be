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
function slugifyVN(input) {
    return input
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
let MenuService = class MenuService {
    constructor(model) {
        this.model = model;
    }
    async assertUniqueSlug(slug, excludeId) {
        if (!slug)
            return;
        const filter = { slug };
        if (excludeId && mongoose_2.Types.ObjectId.isValid(excludeId)) {
            filter._id = { $ne: new mongoose_2.Types.ObjectId(excludeId) };
        }
        const exists = await this.model.exists(filter);
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
        const visited = new Set([parentId]);
        let current = await this.model.findById(parentId).select({ parentId: 1 }).lean();
        while (current === null || current === void 0 ? void 0 : current.parentId) {
            const pid = String(current.parentId);
            if (visited.has(pid))
                throw new common_1.BadRequestException('MENU_CYCLE_DETECTED');
            visited.add(pid);
            depth++;
            if (depth >= 3)
                break;
            current = await this.model.findById(current.parentId).select({ parentId: 1 }).lean();
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
    async create(dto) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const normalizedSlug = dto.slug ? slugifyVN(dto.slug) : undefined;
        await this.assertUniqueSlug(normalizedSlug);
        await this.assertDepthWithinLimit((_a = dto.parentId) !== null && _a !== void 0 ? _a : null);
        if (dto.type === create_menu_dto_1.MenuType.Custom && !dto.url) {
            throw new common_1.BadRequestException('URL_REQUIRED_FOR_CUSTOM');
        }
        if ((dto.type === create_menu_dto_1.MenuType.Post || dto.type === create_menu_dto_1.MenuType.Page) && !dto.targetId) {
            throw new common_1.BadRequestException('TARGET_ID_REQUIRED');
        }
        try {
            const created = await this.model.create({
                label: dto.label,
                type: dto.type,
                slug: normalizedSlug !== null && normalizedSlug !== void 0 ? normalizedSlug : null,
                targetId: dto.targetId ? new mongoose_2.Types.ObjectId(dto.targetId) : null,
                url: (_b = dto.url) !== null && _b !== void 0 ? _b : null,
                icon: (_c = dto.icon) !== null && _c !== void 0 ? _c : null,
                parentId: dto.parentId ? new mongoose_2.Types.ObjectId(dto.parentId) : null,
                order: (_d = dto.order) !== null && _d !== void 0 ? _d : 0,
                visibleRoles: (_e = dto.visibleRoles) !== null && _e !== void 0 ? _e : [],
                status: (_f = dto.status) !== null && _f !== void 0 ? _f : create_menu_dto_1.MenuStatus.Draft,
                publishedAt: (_g = dto.publishedAt) !== null && _g !== void 0 ? _g : null,
            });
            return created.toObject();
        }
        catch (e) {
            if ((e === null || e === void 0 ? void 0 : e.code) === 11000 && ((_h = e === null || e === void 0 ? void 0 : e.keyPattern) === null || _h === void 0 ? void 0 : _h.slug))
                throw new common_1.BadRequestException('DUPLICATE_SLUG');
            throw e;
        }
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
            this.model.find(finalFilter).sort(this.buildSort(sort)).skip((page - 1) * limit).limit(limit).lean(),
            this.model.countDocuments(finalFilter),
        ]);
        return { items, total, page, limit };
    }
    async searchPublic(q = '', limit = 10) {
        const filter = this.applyPublicFilters({ label: { $regex: q, $options: 'i' } });
        const items = await this.model.find(filter).sort({ order: 1, createdAt: -1 }).limit(Math.min(50, Math.max(1, +limit))).select({ label: 1, slug: 1 }).lean();
        return items;
    }
    async findPublicById(id) {
        const finalFilter = this.applyPublicFilters({ _id: new mongoose_2.Types.ObjectId(id) });
        const item = await this.model.findOne(finalFilter).lean();
        if (!item)
            throw new common_1.NotFoundException('MENU_NOT_FOUND');
        return item;
    }
    async findPublicBySlug(slug) {
        const finalFilter = this.applyPublicFilters({ slug: slugifyVN(slug) });
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
            this.model.find(filter).sort(this.buildSort(sort)).skip((page - 1) * limit).limit(limit).lean(),
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
        var _a, _b, _c, _d, _e, _f;
        const update = {};
        if (dto.label !== undefined)
            update.label = dto.label;
        if (dto.type !== undefined)
            update.type = dto.type;
        if (dto.slug !== undefined) {
            const normalized = dto.slug ? slugifyVN(dto.slug) : null;
            await this.assertUniqueSlug(normalized !== null && normalized !== void 0 ? normalized : undefined, id);
            update.slug = normalized;
        }
        if (dto.targetId !== undefined) {
            update.targetId = dto.targetId ? new mongoose_2.Types.ObjectId(dto.targetId) : null;
        }
        if (dto.url !== undefined)
            update.url = (_a = dto.url) !== null && _a !== void 0 ? _a : null;
        if (dto.icon !== undefined)
            update.icon = (_b = dto.icon) !== null && _b !== void 0 ? _b : null;
        if (dto.parentId !== undefined) {
            await this.assertDepthWithinLimit((_c = dto.parentId) !== null && _c !== void 0 ? _c : null, id);
            update.parentId = dto.parentId ? new mongoose_2.Types.ObjectId(dto.parentId) : null;
        }
        if (dto.order !== undefined)
            update.order = dto.order;
        if (dto.visibleRoles !== undefined)
            update.visibleRoles = (_d = dto.visibleRoles) !== null && _d !== void 0 ? _d : [];
        if (dto.status !== undefined)
            update.status = dto.status;
        if (dto.publishedAt !== undefined)
            update.publishedAt = (_e = dto.publishedAt) !== null && _e !== void 0 ? _e : null;
        try {
            const updated = await this.model.findByIdAndUpdate(id, update, { new: true }).lean();
            if (!updated)
                throw new common_1.NotFoundException('MENU_NOT_FOUND');
            return updated;
        }
        catch (e) {
            if ((e === null || e === void 0 ? void 0 : e.code) === 11000 && ((_f = e === null || e === void 0 ? void 0 : e.keyPattern) === null || _f === void 0 ? void 0 : _f.slug))
                throw new common_1.BadRequestException('DUPLICATE_SLUG');
            throw e;
        }
    }
    async remove(id) {
        const hasChild = await this.model.exists({ parentId: new mongoose_2.Types.ObjectId(id) });
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
    __metadata("design:paramtypes", [mongoose_2.Model])
], MenuService);
exports.MenuService = MenuService;
//# sourceMappingURL=menu.service.js.map