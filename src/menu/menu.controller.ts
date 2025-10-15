import { Controller, Get, Param, Query } from '@nestjs/common';
import { MenuService } from './menu.service';
import { Public } from '../auth/decorators/public.decorator';
import { QueryMenuDto } from './dto/query-menu.dto';
import { ParseObjectIdPipe } from './pipes/parse-objectid.pipe';

@Controller('menus')
export class PublicMenuController {
  constructor(private readonly service: MenuService) {}

  @Public()
  @Get()
  list(@Query() q: QueryMenuDto) {
    const { q: keyword, parentId, page = 1, limit = 20, sort } = q;
    return this.service.findAllPublic(keyword, parentId, Number(page), Number(limit), sort);
  }

  @Public()
  @Get('search')
  search(@Query('q') q = '', @Query('limit') limit = '10') {
    return this.service.searchPublic(q, Number(limit));
  }

  @Public()
  @Get(':id')
  byId(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findPublicById(id);
  }

  @Public()
  @Get('by-slug/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.service.findPublicBySlug(slug);
  }
}
