// settings.controller.ts
import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateSettingsDto } from './dto/settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  // FE công khai (cache 60s ở proxy nếu muốn)
  @Public()
  @Get('public')
  getPublic() {
    return this.svc.getPublic();
  }

  // Admin xem/điều chỉnh
  @Get('admin')
  getAdmin() {
    return this.svc.getAdmin();
  }

  // Alias for admin (backward compatibility)
  @Get()
  get() {
    return this.svc.getAdmin();
  }

  @Put('admin')
  update(@Body() dto: UpdateSettingsDto) {
    return this.svc.update(dto);
  }
}
