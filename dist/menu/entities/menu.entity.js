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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuSchema = exports.Menu = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const create_menu_dto_1 = require("../dto/create-menu.dto");
let Menu = class Menu {
};
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, maxlength: 200 }),
    __metadata("design:type", String)
], Menu.prototype, "label", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: Object.values(create_menu_dto_1.MenuType), required: true, index: true }),
    __metadata("design:type", String)
], Menu.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, unique: true, sparse: true, index: true, trim: true, maxlength: 200 }),
    __metadata("design:type", String)
], Menu.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, default: null, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Menu.prototype, "targetId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Menu.prototype, "url", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Menu.prototype, "icon", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Menu', default: null, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Menu.prototype, "parentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0, index: true }),
    __metadata("design:type", Number)
], Menu.prototype, "order", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Menu.prototype, "visibleRoles", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: Object.values(create_menu_dto_1.MenuStatus), default: create_menu_dto_1.MenuStatus.Draft, index: true }),
    __metadata("design:type", String)
], Menu.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null, index: true }),
    __metadata("design:type", Number)
], Menu.prototype, "publishedAt", void 0);
Menu = __decorate([
    (0, mongoose_1.Schema)({ collection: 'menus', timestamps: true })
], Menu);
exports.Menu = Menu;
exports.MenuSchema = mongoose_1.SchemaFactory.createForClass(Menu);
exports.MenuSchema.index({ parentId: 1, order: 1 });
exports.MenuSchema.pre('save', function (next) {
    if (this.slug)
        this.slug = String(this.slug).trim().toLowerCase();
    next();
});
//# sourceMappingURL=menu.entity.js.map