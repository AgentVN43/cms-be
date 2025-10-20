import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/entities/user.entity';

export type CategoryDocument = Category & Document;

@Schema()
export class Category {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: User, required: true })
  author: User;

  @Prop({ type: String, required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: Category.name, default: null, index: true })
  parentId?: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], default: [] })
  ancestors!: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  depth!: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ parentId: 1 });
CategorySchema.index({ ancestors: 1 });
CategorySchema.pre("validate", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

