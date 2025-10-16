import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Menu, MenuSchema } from './entities/menu.entity';
import { MenuService } from './menu.service';
import { PublicMenuController } from './menu.controller';
import { MenuController } from './menu.admin.controller';
import { Blog, BlogSchema } from '../blog/entities/blog.entity';
import { Page, PageSchema } from '../page/entities/page.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Menu.name, schema: MenuSchema },
      { name: Blog.name, schema: BlogSchema },
      { name: Page.name, schema: PageSchema },
    ]),
  ],
  controllers: [PublicMenuController, MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
