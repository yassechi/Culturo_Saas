import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Observation } from 'src/entities/observation.entity';
import { Section } from 'src/entities/section.entity';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { RequiertPermissions } from 'src/users/decorators/permissions.decorator';
import { AuthChard } from 'src/users/guards/auth.guard';
import { PermissionsGuard } from 'src/users/guards/permissions.guard';
import { Permission } from 'src/users/permissions/permission.enum';
import type { JWTPayloadType } from 'src/utils/types';
import { CreateObservationDTO } from './dtos/create.observation.dto';
import { ListObservationsQueryDTO } from './dtos/list.observations.query.dto';
import { ReviewObservationDTO } from './dtos/review.observation.dto';
import { ObservationsService } from './observations.service';

@ApiTags('Observations')
@Controller('observations')
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Get()
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.CONSULTER_OBSERVATIONS)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Lister les observations terrain' })
  @ApiResponse({ status: 200, description: 'Observations récupérées.' })
  async findAll(
    @CurrentUser() payload: JWTPayloadType,
    @Query() query: ListObservationsQueryDTO,
  ): Promise<Observation[]> {
    return this.observationsService.findAll(payload, query);
  }

  @Get('sections/active')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.CONSULTER_OBSERVATIONS)
  @ApiSecurity('bearer')
  @ApiOperation({
    summary: 'Lister les sections actives disponibles pour les observations',
  })
  @ApiResponse({ status: 200, description: 'Sections actives récupérées.' })
  async findActiveSections(): Promise<Section[]> {
    return this.observationsService.findActiveSections();
  }

  @Get(':id')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.CONSULTER_OBSERVATIONS)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupérer une observation par son ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Observation trouvée.' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() payload: JWTPayloadType,
  ): Promise<Observation> {
    return this.observationsService.findOne(id, payload);
  }

  @Post()
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.SAISIR_OBSERVATION)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Créer une observation terrain' })
  @ApiBody({ type: CreateObservationDTO })
  @ApiResponse({ status: 201, description: 'Observation créée.' })
  async create(
    @CurrentUser() payload: JWTPayloadType,
    @Body() dto: CreateObservationDTO,
  ): Promise<Observation> {
    return this.observationsService.create(payload, dto);
  }

  @Patch('mark-seen')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.SAISIR_OBSERVATION)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Marquer toutes les observations vues pour le stagiaire connecté' })
  @ApiResponse({ status: 200 })
  async markAllSeen(@CurrentUser() payload: JWTPayloadType): Promise<{ ok: boolean }> {
    await this.observationsService.markAllSeenForAuthor(payload.id);
    return { ok: true };
  }

  @Patch(':id/review')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.CONSULTER_OBSERVATIONS)
  @ApiSecurity('bearer')
  @ApiOperation({
    summary: 'Valider ou demander des corrections sur une observation',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ReviewObservationDTO })
  @ApiResponse({ status: 200, description: 'Observation relue.' })
  async review(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() payload: JWTPayloadType,
    @Body() dto: ReviewObservationDTO,
  ): Promise<Observation> {
    return this.observationsService.review(id, payload, dto);
  }
}
