import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthChard } from 'src/users/guards/auth.guard';
import { AppSettingsService } from './app-settings.service';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(AuthChard)
@ApiSecurity('bearer')
export class AppSettingsController {
  constructor(private readonly service: AppSettingsService) {}

  @Get()
  getAll(): Promise<Record<string, string>> {
    return this.service.getAll();
  }

  @Patch(':key')
  async set(
    @Param('key') key: string,
    @Body() body: { value: string },
  ): Promise<{ key: string; value: string }> {
    await this.service.set(key, body.value);
    return { key, value: body.value };
  }
}
