import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto, MenuStatus } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/entities/auth.entity';
import { ParseObjectIdPipe } from './pipes/parse-objectid.pipe';

@Controller('menus')
export class MenuController {
  constructor(private readonly service: MenuService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Guest)
  create(@Body() dto: CreateMenuDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('parentId') parentId?: string,
    @Query('status') status?: MenuStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.service.findAllAdmin(q, parentId, status, Number(page ?? 1), Number(limit ?? 20), sort);
  }

  @Get('search')
  adminSearch(@Query('q') q = '', @Query('limit') limit = '10') {
    return this.service.adminSearch(q, Number(limit));
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOneAdmin(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Guest)
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateMenuDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Guest)
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.remove(id);
  }
}


