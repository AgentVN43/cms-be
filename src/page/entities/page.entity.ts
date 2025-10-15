import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PageStatus } from '../dto/create-page.dto';

@Schema({ collection: 'pages', timestamps: true })
export class Page {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ required: true, unique: true, index: true, trim: true, maxlength: 200 })
  slug!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: Types.ObjectId, ref: 'Page', default: null, index: true })
  parentId!: Types.ObjectId | null;

  @Prop({ type: Number, default: 0, index: true })
  order!: number;

  @Prop({ type: String, enum: Object.values(PageStatus), default: PageStatus.Draft, index: true })
  status!: PageStatus;

  @Prop({ type: Boolean, default: true })
  showInSitemap!: boolean;

  @Prop({ type: Date, default: null, index: true })
  publishedAt!: Date | null;
}

export type PageDocument = Page & Document;
export const PageSchema = SchemaFactory.createForClass(Page);

// index hỗ trợ list theo parent + order
PageSchema.index({ parentId: 1, order: 1 });
// đảm bảo slug lowercase
PageSchema.pre('save', function (next) {
  // @ts-ignore
  if (this.slug) this.slug = String(this.slug).toLowerCase();
  next();
});
