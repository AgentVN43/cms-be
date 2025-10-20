// settings.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './entities/settings.entity';
import { UpdateSettingsDto, PublicSettingsDto } from './dto/settings.dto';
import { SETTINGS_KEY, DEFAULT_SETTINGS } from './settings.defaults';
import _ from 'lodash';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private readonly model: Model<SettingsDocument>,
  ) {}

  async getAdmin() {
    const doc = await this.model.findById(SETTINGS_KEY).lean();
    if (doc) return doc;
    // nếu chưa có, trả default (không ghi DB)
    return { _id: SETTINGS_KEY, ...DEFAULT_SETTINGS };
  }

  async ensureExists() {
    // tạo document nếu chưa có với dữ liệu mặc định
    await this.model.updateOne(
      { _id: SETTINGS_KEY },
      { $setOnInsert: { _id: SETTINGS_KEY, ...DEFAULT_SETTINGS } },
      { upsert: true },
    );
  }

  async getPublic() {
    await this.ensureExists(); // lần đầu gọi sẽ khởi tạo
    const s = await this.model.findById(SETTINGS_KEY).lean();
    return {
      general: {
        siteName: s!.general.siteName,
        slogan: s!.general.slogan ?? '',
        description: s!.general.description ?? '',
        logoMediaId: s!.general.logoMediaId ?? null,
        faviconMediaId: s!.general.faviconMediaId ?? null,
      },
      reading: s!.reading,
    };
  }

  //   async update(dto: UpdateSettingsDto) {
  //     const updated = await this.model
  //       .findByIdAndUpdate(
  //         SETTINGS_ID,
  //         {
  //           _id: SETTINGS_ID,
  //           general: dto.general ?? DEFAULT_SETTINGS.general,
  //           reading: dto.reading ?? DEFAULT_SETTINGS.reading,
  //           extra: dto.extra ?? DEFAULT_SETTINGS.extra,
  //         },
  //         { new: true, upsert: true, setDefaultsOnInsert: true },
  //       )
  //       .lean();
  //     return updated!;
  //   }
  async update(dto: Partial<UpdateSettingsDto>) {
    const current = await this.getAdmin();
    const next = _.merge({}, DEFAULT_SETTINGS, current, dto); // DEFAULT -> current -> dto
    const updated = await this.model
      .findByIdAndUpdate(SETTINGS_KEY, next, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      })
      .lean();
    return updated!;
  }
}
