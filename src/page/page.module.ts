import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Page, PageSchema } from './entities/page.entity';
import { PageService } from './page.service';
import { PageController, PublicPageController } from './page.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Page.name, schema: PageSchema }]),
  ],
  controllers: [PageController, PublicPageController],
  providers: [PageService],
  exports: [PageService],
})
export class PageModule {}
