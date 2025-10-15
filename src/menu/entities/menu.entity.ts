import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MenuStatus, MenuType } from '../dto/create-menu.dto';

@Schema({ collection: 'menus', timestamps: true })
export class Menu {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  label!: string;

  @Prop({ type: String, enum: Object.values(MenuType), required: true, index: true })
  type!: MenuType;

  // slug optional + unique sparse
  @Prop({ type: String, unique: true, sparse: true, index: true, trim: true, maxlength: 200 })
  slug?: string | null;

  @Prop({ type: Types.ObjectId, default: null, index: true })
  targetId?: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  url?: string | null;

  @Prop({ type: String, default: null })
  icon?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'Menu', default: null, index: true })
  parentId!: Types.ObjectId | null;

  @Prop({ type: Number, default: 0, index: true })
  order!: number;

  @Prop({ type: [String], default: [] })
  visibleRoles!: string[];

  @Prop({ type: String, enum: Object.values(MenuStatus), default: MenuStatus.Draft, index: true })
  status!: MenuStatus;

  // timestamp (ms)
  @Prop({ type: Number, default: null, index: true })
  publishedAt!: number | null;
}

export type MenuDocument = Menu & Document;
export const MenuSchema = SchemaFactory.createForClass(Menu);

MenuSchema.index({ parentId: 1, order: 1 });

// force lowercase slug on save if present
MenuSchema.pre('save', function (next) {
  // @ts-ignore
  if (this.slug) this.slug = String(this.slug).trim().toLowerCase();
  next();
});
