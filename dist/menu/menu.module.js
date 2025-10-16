"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const menu_entity_1 = require("./entities/menu.entity");
const menu_service_1 = require("./menu.service");
const menu_controller_1 = require("./menu.controller");
const menu_admin_controller_1 = require("./menu.admin.controller");
const blog_entity_1 = require("../blog/entities/blog.entity");
const page_entity_1 = require("../page/entities/page.entity");
let MenuModule = class MenuModule {
};
MenuModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: menu_entity_1.Menu.name, schema: menu_entity_1.MenuSchema },
                { name: blog_entity_1.Blog.name, schema: blog_entity_1.BlogSchema },
                { name: page_entity_1.Page.name, schema: page_entity_1.PageSchema },
            ]),
        ],
        controllers: [menu_controller_1.PublicMenuController, menu_admin_controller_1.MenuController],
        providers: [menu_service_1.MenuService],
        exports: [menu_service_1.MenuService],
    })
], MenuModule);
exports.MenuModule = MenuModule;
//# sourceMappingURL=menu.module.js.map