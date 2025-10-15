import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Menu, MenuSchema } from './entities/menu.entity';
import { MenuService } from './menu.service';
import { PublicMenuController } from './menu.controller';
import { MenuController } from './menu.admin.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Menu.name, schema: MenuSchema }])],
  controllers: [PublicMenuController, MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
