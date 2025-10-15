import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Menu, MenuDocument } from './entities/menu.entity';
import { CreateMenuDto, MenuStatus, MenuType } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';

function slugifyVN(input: string) {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class MenuService {
  constructor(@InjectModel(Menu.name) private readonly model: Model<MenuDocument>) {}

  // ------- Helpers -------
  private async assertUniqueSlug(slug?: string, excludeId?: string) {
    if (!slug) return;
    const filter: any = { slug };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const exists = await this.model.exists(filter);
    if (exists) throw new BadRequestException('DUPLICATE_SLUG');
  }

  // depth ≤ 3: root(0) -> child(1) -> grandchild(2). Cấm tạo node nếu parent depth = 2
  private async assertDepthWithinLimit(parentId?: string | null, selfId?: string) {
    if (!parentId) return;
    if (!Types.ObjectId.isValid(parentId)) throw new BadRequestException('INVALID_PARENT_ID');
    if (selfId && parentId === selfId) throw new BadRequestException('MENU_CYCLE_DETECTED');

    let depth = 1;
    const visited = new Set<string>([parentId]);
    let current = await this.model.findById(parentId).select({ parentId: 1 }).lean();
    while (current?.parentId) {
      const pid = String(current.parentId);
      if (visited.has(pid)) throw new BadRequestException('MENU_CYCLE_DETECTED');
      visited.add(pid);
      depth++;
      if (depth >= 3) break;
      current = await this.model.findById(current.parentId).select({ parentId: 1 }).lean();
    }
    if (depth >= 3) throw new BadRequestException('MENU_DEPTH_EXCEEDED');
  }

  private applyPublicFilters(base: FilterQuery<MenuDocument>): FilterQuery<MenuDocument> {
    const nowMs = Date.now();
    return {
      ...base,
      status: MenuStatus.Published,
      $or: [{ publishedAt: null }, { publishedAt: { $lte: nowMs } }],
    };
  }

  private buildSort(sort?: string) {
    switch (sort) {
      case 'order_asc':
        return { parentId: 'asc', order: 'asc' } as const;
      case 'createdAt_desc':
        return { createdAt: 'desc' } as const;
      case 'publishedAt_desc':
      default:
        return { publishedAt: 'desc', createdAt: 'desc' } as const;
    }
  }

  // ------- CRUD -------
  async create(dto: CreateMenuDto): Promise<Menu> {
    // normalize slug if provided
    const normalizedSlug = dto.slug ? slugifyVN(dto.slug) : undefined;
    await this.assertUniqueSlug(normalizedSlug);
    await this.assertDepthWithinLimit(dto.parentId ?? null);

    // type validation
    if (dto.type === MenuType.Custom && !dto.url) {
      throw new BadRequestException('URL_REQUIRED_FOR_CUSTOM');
    }
    if ((dto.type === MenuType.Post || dto.type === MenuType.Page) && !dto.targetId) {
      throw new BadRequestException('TARGET_ID_REQUIRED');
    }

    try {
      const created = await this.model.create({
        label: dto.label,
        type: dto.type,
        slug: normalizedSlug ?? null,
        targetId: dto.targetId ? new Types.ObjectId(dto.targetId) : null,
        url: dto.url ?? null,
        icon: dto.icon ?? null,
        parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
        order: dto.order ?? 0,
        visibleRoles: dto.visibleRoles ?? [],
        status: dto.status ?? MenuStatus.Draft,
        publishedAt: dto.publishedAt ?? null,
      });
      return created.toObject();
    } catch (e: any) {
      if (e?.code === 11000 && e?.keyPattern?.slug) throw new BadRequestException('DUPLICATE_SLUG');
      throw e;
    }
  }

  async findAllPublic(q: string | undefined, parentId: string | undefined, page = 1, limit = 20, sort?: string) {
    const filter: FilterQuery<MenuDocument> = {};
    if (q) filter.label = { $regex: q, $options: 'i' };
    if (typeof parentId !== 'undefined') {
      filter.parentId = parentId ? new Types.ObjectId(parentId) : null;
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

  async findPublicById(id: string): Promise<Menu> {
    const finalFilter = this.applyPublicFilters({ _id: new Types.ObjectId(id) });
    const item = await this.model.findOne(finalFilter).lean();
    if (!item) throw new NotFoundException('MENU_NOT_FOUND');
    return item;
  }

  async findPublicBySlug(slug: string): Promise<Menu> {
    const finalFilter = this.applyPublicFilters({ slug: slugifyVN(slug) });
    const item = await this.model.findOne(finalFilter).lean();
    if (!item) throw new NotFoundException('MENU_NOT_FOUND');
    return item;
  }

  // ------- Admin -------
  async findAllAdmin(q: string | undefined, parentId: string | undefined, status: MenuStatus | undefined, page = 1, limit = 20, sort?: string) {
    const filter: FilterQuery<MenuDocument> = {};
    if (q) filter.label = { $regex: q, $options: 'i' };
    if (typeof parentId !== 'undefined') {
      filter.parentId = parentId ? new Types.ObjectId(parentId) : null;
    }
    if (status) filter.status = status;

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

  async findOneAdmin(id: string): Promise<Menu> {
    const item = await this.model.findById(id).lean();
    if (!item) throw new NotFoundException('MENU_NOT_FOUND');
    return item;
  }

  async update(id: string, dto: UpdateMenuDto): Promise<Menu> {
    const update: any = {};
    if (dto.label !== undefined) update.label = dto.label;
    if (dto.type !== undefined) update.type = dto.type;
    if (dto.slug !== undefined) {
      const normalized = dto.slug ? slugifyVN(dto.slug) : null;
      await this.assertUniqueSlug(normalized ?? undefined, id);
      update.slug = normalized;
    }
    if (dto.targetId !== undefined) {
      update.targetId = dto.targetId ? new Types.ObjectId(dto.targetId) : null;
    }
    if (dto.url !== undefined) update.url = dto.url ?? null;
    if (dto.icon !== undefined) update.icon = dto.icon ?? null;

    if (dto.parentId !== undefined) {
      await this.assertDepthWithinLimit(dto.parentId ?? null, id);
      update.parentId = dto.parentId ? new Types.ObjectId(dto.parentId) : null;
    }
    if (dto.order !== undefined) update.order = dto.order;
    if (dto.visibleRoles !== undefined) update.visibleRoles = dto.visibleRoles ?? [];
    if (dto.status !== undefined) update.status = dto.status;
    if (dto.publishedAt !== undefined) update.publishedAt = dto.publishedAt ?? null;

    try {
      const updated = await this.model.findByIdAndUpdate(id, update, { new: true }).lean();
      if (!updated) throw new NotFoundException('MENU_NOT_FOUND');
      return updated;
    } catch (e: any) {
      if (e?.code === 11000 && e?.keyPattern?.slug) throw new BadRequestException('DUPLICATE_SLUG');
      throw e;
    }
  }

  async remove(id: string) {
    // optionally block delete if has children
    const hasChild = await this.model.exists({ parentId: new Types.ObjectId(id) });
    if (hasChild) throw new BadRequestException('MENU_HAS_CHILDREN');
    const res = await this.model.findByIdAndDelete(id).lean();
    if (!res) throw new NotFoundException('MENU_NOT_FOUND');
    return { ok: true };
  }
}
