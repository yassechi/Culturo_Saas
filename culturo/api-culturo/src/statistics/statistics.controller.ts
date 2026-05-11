import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { AuthChard } from 'src/users/guards/auth.guard';
import type { JWTPayloadType } from 'src/utils/types';
import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupérer les statistiques du tableau de bord' })
  @ApiResponse({ status: 200, description: 'Statistiques calculées.' })
  async getDashboard(@CurrentUser() payload: JWTPayloadType) {
    return this.statisticsService.getDashboardSummary(payload);
  }
}
