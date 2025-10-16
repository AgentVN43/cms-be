/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/aggregate" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/callback" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/collection" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/connection" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/cursor" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/document" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/error" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/expressions" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/helpers" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/middlewares" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/indexes" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/models" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/mongooseoptions" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/pipelinestage" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/populate" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/query" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/schemaoptions" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/schematypes" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/session" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/types" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/utility" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/validation" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/virtuals" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose" />
/// <reference types="mongoose/types/inferschematype" />
/// <reference types="mongoose-unique-validator/node_modules/mongoose/types/inferschematype" />
import { Model, Types } from 'mongoose';
import { Menu, MenuDocument } from './entities/menu.entity';
import { CreateMenuDto, MenuStatus } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { PageDocument } from '../page/entities/page.entity';
export declare class MenuService {
    private readonly model;
    private readonly blogModel;
    private readonly pageModel;
    constructor(model: Model<MenuDocument>, blogModel: Model<any>, pageModel: Model<PageDocument>);
    private assertDepthWithinLimit;
    private applyPublicFilters;
    private buildSort;
    private buildHref;
    create(dto: CreateMenuDto): Promise<Menu & import("mongoose").Document<any, any, any> & {
        _id: Types.ObjectId;
    }>;
    findAllPublic(q: string | undefined, parentId: string | undefined, page?: number, limit?: number, sort?: string): Promise<{
        items: (import("mongoose").FlattenMaps<MenuDocument> & {
            _id: Types.ObjectId;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    searchPublic(q?: string, limit?: number): Promise<(import("mongoose").FlattenMaps<MenuDocument> & {
        _id: Types.ObjectId;
    })[]>;
    findPublicById(id: string): Promise<Menu>;
    findPublicByHref(href: string): Promise<Menu>;
    findAllAdmin(q: string | undefined, parentId: string | undefined, status: MenuStatus | undefined, page?: number, limit?: number, sort?: string): Promise<{
        items: (import("mongoose").FlattenMaps<MenuDocument> & {
            _id: Types.ObjectId;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    adminSearch(q?: string, limit?: number): Promise<(import("mongoose").FlattenMaps<MenuDocument> & {
        _id: Types.ObjectId;
    })[]>;
    findOneAdmin(id: string): Promise<Menu>;
    update(id: string, dto: UpdateMenuDto): Promise<Menu & import("mongoose").Document<any, any, any> & {
        _id: Types.ObjectId;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
