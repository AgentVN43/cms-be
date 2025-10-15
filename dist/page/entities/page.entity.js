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
exports.PageSchema = exports.Page = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const create_page_dto_1 = require("../dto/create-page.dto");
let Page = class Page {
};
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, maxlength: 200 }),
    __metadata("design:type", String)
], Page.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true, trim: true, maxlength: 200 }),
    __metadata("design:type", String)
], Page.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Page.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Page', default: null, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Page.prototype, "parentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0, index: true }),
    __metadata("design:type", Number)
], Page.prototype, "order", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: Object.values(create_page_dto_1.PageStatus), default: create_page_dto_1.PageStatus.Draft, index: true }),
    __metadata("design:type", String)
], Page.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], Page.prototype, "showInSitemap", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null, index: true }),
    __metadata("design:type", Date)
], Page.prototype, "publishedAt", void 0);
Page = __decorate([
    (0, mongoose_1.Schema)({ collection: 'pages', timestamps: true })
], Page);
exports.Page = Page;
exports.PageSchema = mongoose_1.SchemaFactory.createForClass(Page);
exports.PageSchema.index({ parentId: 1, order: 1 });
exports.PageSchema.pre('save', function (next) {
    if (this.slug)
        this.slug = String(this.slug).toLowerCase();
    next();
});
//# sourceMappingURL=page.entity.js.map