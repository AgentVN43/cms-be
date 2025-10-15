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
exports.PublicMenuController = void 0;
const common_1 = require("@nestjs/common");
const menu_service_1 = require("./menu.service");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const query_menu_dto_1 = require("./dto/query-menu.dto");
const parse_objectid_pipe_1 = require("./pipes/parse-objectid.pipe");
let PublicMenuController = class PublicMenuController {
    constructor(service) {
        this.service = service;
    }
    list(q) {
        const { q: keyword, parentId, page = 1, limit = 20, sort } = q;
        return this.service.findAllPublic(keyword, parentId, Number(page), Number(limit), sort);
    }
    search(q = '', limit = '10') {
        return this.service.searchPublic(q, Number(limit));
    }
    byId(id) {
        return this.service.findPublicById(id);
    }
    bySlug(slug) {
        return this.service.findPublicBySlug(slug);
    }
};
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_menu_dto_1.QueryMenuDto]),
    __metadata("design:returntype", void 0)
], PublicMenuController.prototype, "list", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PublicMenuController.prototype, "search", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', parse_objectid_pipe_1.ParseObjectIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicMenuController.prototype, "byId", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('by-slug/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicMenuController.prototype, "bySlug", null);
PublicMenuController = __decorate([
    (0, common_1.Controller)('menus'),
    __metadata("design:paramtypes", [menu_service_1.MenuService])
], PublicMenuController);
exports.PublicMenuController = PublicMenuController;
//# sourceMappingURL=menu.controller.js.map