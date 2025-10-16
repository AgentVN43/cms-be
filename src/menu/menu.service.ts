import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Menu, MenuDocument } from './entities/menu.entity';
import { CreateMenuDto, MenuStatus, MenuType } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Page, PageDocument } from '../page/entities/page.entity';

function isValidHttpUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Menu.name) private readonly model: Model<MenuDocument>,
    @InjectModel('Blog') private readonly blogModel: Model<any>,
    @InjectModel(Page.name) private readonly pageModel: Model<PageDocument>,
  ) {}

  // ------- Helpers -------

  // depth â‰¤ 3: root(0) -> child(1) -> grandchild(2). Cáº¥m táº¡o node náº¿u parent depth = 2
  private async assertDepthWithinLimit(
    parentId?: string | null,
    selfId?: string,
  ) {
    if (!parentId) return;
    if (!Types.ObjectId.isValid(parentId))
      throw new BadRequestException('INVALID_PARENT_ID');
    if (selfId && parentId === selfId)
      throw new BadRequestException('MENU_CYCLE_DETECTED');

    let depth = 1;
    const visited = new Set<string>([parentId]);
    let current = await this.model
      .findById(parentId)
      .select({ parentId: 1 })
      .lean();
    while (current?.parentId) {
      const pid = String(current.parentId);
      if (visited.has(pid))
        throw new BadRequestException('MENU_CYCLE_DETECTED');
      visited.add(pid);
      depth++;
      if (depth >= 3) break;
      current = await this.model
        .findById(current.parentId)
        .select({ parentId: 1 })
        .lean();
    }
    if (depth >= 3) throw new BadRequestException('MENU_DEPTH_EXCEEDED');
  }

  private applyPublicFilters(
    base: FilterQuery<MenuDocument>,
  ): FilterQuery<MenuDocument> {
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

  private buildHref(
    type: 'post' | 'page' | 'custom',
    targetSlug?: string | null,
    url?: string | null,
  ): string {
    if (type === 'custom') return url ?? '#';
    if (type === 'post') return targetSlug ? `/posts/${targetSlug}` : '#';
    if (type === 'page') return targetSlug ? `/pages/${targetSlug}` : '#';
    return '#';
  }

  // ------- CRUD -------

  async create(dto: CreateMenuDto) {
    // validate depth sá»›m (náº¿u cÃ³ parentId)
    if (typeof dto.parentId !== 'undefined') {
      await this.assertDepthWithinLimit(dto.parentId ?? null, undefined);
    }

    if (dto.type === 'post' || dto.type === 'page') {
      if (!dto.targetId) throw new BadRequestException('targetId required');

      const targetDoc = (await (dto.type === 'post'
        ? this.blogModel.findById(dto.targetId).select({ slug: 1 }).lean()
        : this.pageModel
            .findById(dto.targetId)
            .select({ slug: 1 })
            .lean())) as { _id?: Types.ObjectId; slug?: string } | null;

      if (!targetDoc) throw new BadRequestException('TARGET_NOT_FOUND');

      const targetSlug = String(targetDoc.slug ?? '')
        .trim()
        .toLowerCase();

      const doc = await this.model.create({
        ...dto,
        targetId:
          targetDoc?._id instanceof Types.ObjectId
            ? targetDoc._id
            : new Types.ObjectId(dto.targetId),
        url: null,
        targetSlug,
        slug: this.buildHref(dto.type, targetSlug, null),
      });
      return doc.toObject();
    }

    // custom
    if (!dto.url) throw new BadRequestException('url required');
    if (!isValidHttpUrl(dto.url)) throw new BadRequestException('INVALID_URL');

    const doc = await this.model.create({
      ...dto,
      targetId: null,
      targetSlug: null,
      slug: dto.url, // href = url
    });
    return doc.toObject();
  }

  async findAllPublic(
    q: string | undefined,
    parentId: string | undefined,
    page = 1,
    limit = 20,
    sort?: string,
  ) {
    const filter: FilterQuery<MenuDocument> = {};
    if (q) filter.label = { $regex: q, $options: 'i' };
    if (typeof parentId !== 'undefined') {
      filter.parentId = parentId ? new Types.ObjectId(parentId) : null;
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
      .select({ label: 1, slug: 1 }) // slug = href
      .lean();
    return items;
  }

  async findPublicById(id: string): Promise<Menu> {
    const finalFilter = this.applyPublicFilters({
      _id: new Types.ObjectId(id),
    });
    const item = await this.model.findOne(finalFilter).lean();
    if (!item) throw new NotFoundException('MENU_NOT_FOUND');
    return item as any;
  }

  /**
   * VÃ¬ slug (public) lÃ  href (VD: /blogs/abc, /pages/xyz, hoáº·c https://...),
   * ta KHÃ”NG slugify ná»¯a. So khá»›p chÃ­nh xÃ¡c.
   */
  async findPublicByHref(href: string): Promise<Menu> {
    const finalFilter = this.applyPublicFilters({ slug: href });
    const item = await this.model.findOne(finalFilter).lean();
    if (!item) throw new NotFoundException('MENU_NOT_FOUND');
    return item as any;
  }

  // ------- Admin -------

  async findAllAdmin(
    q: string | undefined,
    parentId: string | undefined,
    status: MenuStatus | undefined,
    page = 1,
    limit = 20,
    sort?: string,
  ) {
    const filter: FilterQuery<MenuDocument> = {};
    if (q) filter.label = { $regex: q, $options: 'i' };
    if (typeof parentId !== 'undefined') {
      filter.parentId = parentId ? new Types.ObjectId(parentId) : null;
    }
    if (status) filter.status = status;

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
      .select({ label: 1, slug: 1 }) // slug = href
      .lean();
    return items;
  }

  async findOneAdmin(id: string): Promise<Menu> {
    const item = await this.model.findById(id).lean();
    if (!item) throw new NotFoundException('MENU_NOT_FOUND');
    return item as any;
  }

  async update(id: string, dto: UpdateMenuDto) {
    const item = await this.model.findById(id);
    if (!item) throw new NotFoundException('MENU_NOT_FOUND');

    // validate depth náº¿u thay parentId
    if (typeof dto.parentId !== 'undefined') {
      await this.assertDepthWithinLimit(dto.parentId ?? null, String(item._id));
    }

    const next: any = { ...dto };

    const nextType: MenuType = (dto.type as any) ?? item.type;

    if (nextType === 'post' || nextType === 'page') {
      const targetId = dto.targetId ?? item.targetId;
      if (!targetId) throw new BadRequestException('targetId required');

      const resolvedTarget = (await (nextType === 'post'
        ? this.blogModel.findById(targetId).select({ slug: 1 }).lean()
        : this.pageModel.findById(targetId).select({ slug: 1 }).lean())) as {
        _id?: Types.ObjectId;
        slug?: string;
      } | null;
      if (!resolvedTarget) throw new BadRequestException('TARGET_NOT_FOUND');

      const resolvedId =
        resolvedTarget?._id instanceof Types.ObjectId
          ? resolvedTarget._id
          : targetId instanceof Types.ObjectId
          ? targetId
          : new Types.ObjectId(String(targetId));
      const targetSlug = String(resolvedTarget?.slug ?? '')
        .trim()
        .toLowerCase();

      next.type = nextType;
      next.targetId = resolvedId as any;
      next.targetSlug = targetSlug;
      next.url = null;
      next.slug = this.buildHref(nextType, targetSlug, null); // href
    } else if (nextType === 'custom') {
      const url = dto.url ?? item.url;
      if (!url) throw new BadRequestException('url required');
      if (!isValidHttpUrl(url)) throw new BadRequestException('INVALID_URL');

      next.type = 'custom';
      next.url = url;
      next.targetId = null;
      next.targetSlug = null;
      next.slug = url; // href
    }

    Object.assign(item, next);
    await item.save();
    return item.toObject();
  }

  async remove(id: string) {
    // optionally block delete if has children
    const hasChild = await this.model.exists({
      parentId: new Types.ObjectId(id),
    });
    if (hasChild) throw new BadRequestException('MENU_HAS_CHILDREN');
    const res = await this.model.findByIdAndDelete(id).lean();
    if (!res) throw new NotFoundException('MENU_NOT_FOUND');
    return { ok: true };
  }
}
