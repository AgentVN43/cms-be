import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/entities/auth.entity';
import { PageService } from './page.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PageStatus } from './dto/create-page.dto';

@Controller('pages')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  // ===== Admin =====
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Guest)
  create(@Body() dto: CreatePageDto) {
    return this.pageService.create(dto);
  }

  @Public()
  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('parentId') parentId?: string,
    @Query('status') status?: PageStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.pageService.findAll({
      q,
      parentId: typeof parentId === 'string' ? parentId : undefined,
      status,
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
    });
  }

  @Public()
  @Get('search')
  adminSearch(@Query('q') q = '', @Query('limit') limit = '10') {
    return this.pageService.adminSearch(q, Number(limit));
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pageService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Guest)
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pageService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Guest)
  remove(@Param('id') id: string) {
    return this.pageService.remove(id);
  }
}

// ===== Public Controller =====
@Controller()
export class PublicPageController {
  constructor(private readonly pageService: PageService) {}

  @Public()
  @Get(':slug((?!pages$).+)')
  getPublicBySlug(@Param('slug') slug: string) {
    return this.pageService.findPublicBySlug(slug);
  }
}
