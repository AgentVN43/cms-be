// settings.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'setting', timestamps: true })
export class Settings {
  @Prop({ type: String, required: true, default: 'site' })
  _id!: string;
  @Prop({
    type: {
      siteName: {
        type: String,
        required: true,
        default: '',
      },
      slogan: { type: String, default: '' },
      description: {
        type: String,
        default: '',
      },
      logoMediaId: {
        type: String,
        default: null,
      },
      adminEmail: {
        type: String,
        required: true,
        lowercase: true,
        default: '',
      },
      faviconMediaId: {
        type: String,
        default: null,
      },
    },
    required: true,
    _id: false,
  })
  general!: any;

  @Prop({
    type: {
      postsPerPage: {
        type: Number,
        min: 1,
        max: 100,
        default: 10,
      },
      relatedPosts: {
        type: Number,
        min: 0,
        max: 20,
        default: 4,
      },
    },
    required: true,
    _id: false,
  })
  reading!: any;

  @Prop({ type: Object, default: {} })
  extra!: Record<string, any>;
}

export type SettingsDocument = Settings & Document & { _id: string };
export const SettingsSchema = SchemaFactory.createForClass(Settings);
