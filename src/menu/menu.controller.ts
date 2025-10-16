import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { Public } from '../auth/decorators/public.decorator';
import { ParseObjectIdPipe } from './pipes/parse-objectid.pipe';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/entities/auth.entity';
import { MenuStatus } from './dto/create-menu.dto';

@Controller('menus')
export class PublicMenuController {
  constructor(private readonly service: MenuService) {}

  /**
   * Public list (phẳng) với filter cơ bản
   * - q: keyword
   * - parentId: null | ObjectId (render cấp 1 khi parentId=null)
   * - page, limit, sort
   */
  @Public()
  @Get()
  list(
    @Query('q') keyword?: string,
    @Query('parentId') parentId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sort') sort?: string,
  ) {
    return this.service.findAllPublic(keyword, parentId, page!, limit!, sort);
  }

  /**
   * Public search nhanh (label + href)
   */
  @Public()
  @Get('search')
  search(
    @Query('q') q = '',
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.service.searchPublic(q, limit!);
  }

  /**
   * Resolve theo HREF (vì slug public = href). Ví dụ:
   * GET /menus/by-href?href=/blogs/menu-tech
   * GET /menus/by-href?href=/pages/gioi-thieu
   * GET /menus/by-href?href=https://google.com
   */
  @Public()
  @Get('by-href')
  byHref(@Query('href') href: string) {
    if (!href) {
      // giữ message ngắn gọn
      throw new Error('href is required');
    }
    return this.service.findPublicByHref(href);
  }

  /**
   * LẤY THEO ID – đặt CUỐI để tránh xung đột với các route khác
   */
  @Public()
  @Get(':id')
  byId(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findPublicById(id);
  }

  /**
   * Admin list (UI quản trị) - yêu cầu quyền Admin | Guest
   */
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Guest)
  @Get('admin/list')
  adminList(
    @Query('q') q?: string,
    @Query('parentId') parentId?: string,
    @Query('status') status?: MenuStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sort') sort?: string,
  ) {
    return this.service.findAllAdmin(
      q,
      parentId,
      status,
      page ?? 1,
      limit ?? 20,
      sort,
    );
  }
}


