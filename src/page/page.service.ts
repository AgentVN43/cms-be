import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Page, PageDocument } from './entities/page.entity';
import { CreatePageDto, PageStatus } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

function slugify(input: string) {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bỏ dấu tiếng Việt
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class PageService {
  constructor(@InjectModel(Page.name) private readonly pageModel: Model<PageDocument>) {}

  /** Admin create */
  async create(dto: CreatePageDto): Promise<Page> {
    const slug = (dto.slug && dto.slug.trim()) ? slugify(dto.slug) : slugify(dto.title);
    await this.assertDepthWithinLimit(dto.parentId);
    await this.assertUniqueSlug(slug);

    const publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;

    const created = await this.pageModel.create({
      title: dto.title,
      slug,
      content: dto.content,
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
      order: dto.order ?? 0,
      status: dto.status ?? PageStatus.Draft,
      showInSitemap: dto.showInSitemap ?? true,
      publishedAt,
    });
    return created.toObject();
  }

  /** Admin list (paginate + filter) */
  async findAll(params: {
    q?: string;
    parentId?: string | null;
    status?: PageStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit ?? 20)));
    const filter: FilterQuery<PageDocument> = {};
    if (params.q) filter.title = { $regex: params.q, $options: 'i' };
    if (typeof params.parentId !== 'undefined') {
      filter.parentId = params.parentId ? new Types.ObjectId(params.parentId) : null;
    }
    if (params.status) filter.status = params.status;

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

  /** Admin get by id */
  async findOne(id: string): Promise<Page> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('INVALID_ID');
    const page = await this.pageModel.findById(id).lean();
    if (!page) throw new NotFoundException('PAGE_NOT_FOUND');
    return page;
  }

  /** Public: get by slug (only published & time reached) */
  async findPublicBySlug(slug: string): Promise<Page> {
    const now = new Date();
    const page = await this.pageModel
      .findOne({
        slug: slugify(slug),
        status: PageStatus.Published,
        $or: [{ publishedAt: null }, { publishedAt: { $lte: now } }],
      })
      .lean();
    if (!page) throw new NotFoundException('PAGE_NOT_FOUND');
    return page;
  }

  /** Admin update */
  async update(id: string, dto: UpdatePageDto): Promise<Page> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('INVALID_ID');

    const update: any = {};
    if (dto.title !== undefined) update.title = dto.title;
    if (dto.slug !== undefined) {
      const newSlug = dto.slug ? slugify(dto.slug) : undefined;
      if (newSlug) await this.assertUniqueSlug(newSlug, id);
      update.slug = newSlug;
    }
    if (dto.content !== undefined) update.content = dto.content;

    if (dto.parentId !== undefined) {
      await this.assertDepthWithinLimit(dto.parentId, id);
      update.parentId = dto.parentId ? new Types.ObjectId(dto.parentId) : null;
    }
    if (dto.order !== undefined) update.order = dto.order;
    if (dto.status !== undefined) update.status = dto.status;
    if (dto.showInSitemap !== undefined) update.showInSitemap = dto.showInSitemap;
    if (dto.publishedAt !== undefined) update.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;

    const updated = await this.pageModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) throw new NotFoundException('PAGE_NOT_FOUND');
    return updated;
    }

  /** Admin remove */
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('INVALID_ID');
    // tùy nhu cầu: chặn xoá nếu có child
    const hasChild = await this.pageModel.exists({ parentId: new Types.ObjectId(id) });
    if (hasChild) throw new BadRequestException('PAGE_HAS_CHILDREN');
    const res = await this.pageModel.findByIdAndDelete(id).lean();
    if (!res) throw new NotFoundException('PAGE_NOT_FOUND');
    return { ok: true };
  }

  /** Search admin (cho dropdown chọn page khi tạo menu) */
  async adminSearch(q: string, limit = 10) {
    const items = await this.pageModel
      .find({ title: { $regex: q ?? '', $options: 'i' } })
      .sort({ title: 1 })
      .limit(Math.min(50, Math.max(1, Number(limit))))
      .select({ _id: 1, title: 1, slug: 1, status: 1 })
      .lean();
    return items;
  }

  private async assertUniqueSlug(slug: string, excludeId?: string) {
    const filter: any = { slug };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const exists = await this.pageModel.exists(filter);
    if (exists) throw new BadRequestException('DUPLICATE_SLUG');
  }

  // depth ≤ 3: root(0) -> child(1) -> grandchild(2); cấm cấp 4
  private async assertDepthWithinLimit(parentId?: string | null, selfId?: string) {
    if (!parentId) return; // root
    if (!Types.ObjectId.isValid(parentId)) throw new BadRequestException('INVALID_PARENT_ID');

    // kiểm tra cycle
    if (selfId && parentId === selfId) throw new BadRequestException('MENU_CYCLE_DETECTED');

    // tính depth ngược lên
    let depth = 1;
    let current = await this.pageModel.findById(parentId).select({ parentId: 1 }).lean();
    const visited = new Set<string>([parentId]);
    while (current?.parentId) {
      const pid = String(current.parentId);
      if (visited.has(pid)) throw new BadRequestException('MENU_CYCLE_DETECTED');
      visited.add(pid);
      depth++;
      if (depth >= 3) break; // parent depth 2 => child sẽ thành 3 (OK); cấm thêm 1 cấp nữa
      current = await this.pageModel.findById(current.parentId).select({ parentId: 1 }).lean();
    }
    if (depth >= 3) throw new BadRequestException('MENU_DEPTH_EXCEEDED');
  }
}
