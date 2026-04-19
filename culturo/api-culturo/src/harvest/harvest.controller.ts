import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { HarvestService } from './harvest.service';
import { CreateHarvestDTO } from './dtos/create.harvest.dto';
import { UpdateHarvestDTO } from './dtos/update.harvest.dto';
import { Harvest } from 'src/entities/harvest.entity';
import { AuthChard } from '../users/guards/auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequiertPermissions } from '../users/decorators/permissions.decorator';
import { Permission } from 'src/users/permissions/permission.enum';

@ApiTags('Harvests')
@Controller('harvests')
export class HarvestController {
  constructor(private readonly harvestService: HarvestService) {}

  /**
   * Récupérer toutes les récoltes - Accessible aux utilisateurs authentifiés
   */
  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère toutes les récoltes' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste de toutes les récoltes',
    type: [Harvest],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async findAll(): Promise<Harvest[]> {
    return this.harvestService.findAll();
  }

  /**
   * Récupérer une récolte par ID - Accessible aux utilisateurs authentifiés
   */
  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère une récolte par ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la récolte' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Détails de la récolte',
    type: Harvest,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Récolte non trouvée' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Harvest> {
    return this.harvestService.findOne(id);
  }

  /**
   * Créer une nouvelle récolte - Accessible aux utilisateurs authentifiés (FORMATEUR et STAGIAIRE)
   */
  @Post()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({
    summary: 'Crée une nouvelle récolte et marque la section comme inactive',
  })
  @ApiBody({ type: CreateHarvestDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      "La récolte a été créée. La section associée est marquée 'section_active = false' et sa date de fin est mise à jour.",
    type: Harvest,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Utilisateur ou Section non trouvé(e).',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async create(@Body() createHarvestDto: CreateHarvestDTO): Promise<Harvest> {
    return this.harvestService.create(createHarvestDto);
  }

  /**
   * Mettre à jour une récolte - FORMATEUR uniquement
   */
  @Patch(':id')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.MODIFIER_SUPPRIMER_RECOLTE)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Met à jour une récolte existante' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la récolte' })
  @ApiBody({ type: UpdateHarvestDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'La récolte a été mise à jour.',
    type: Harvest,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Récolte, Utilisateur ou Section non trouvé(e).',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission refusée - Réservé aux formateurs' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHarvestDto: UpdateHarvestDTO,
  ): Promise<Harvest> {
    return this.harvestService.update(id, updateHarvestDto);
  }

  /**
   * Supprimer une récolte - FORMATEUR uniquement
   */
  @Delete(':id')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.MODIFIER_SUPPRIMER_RECOLTE)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime une récolte' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la récolte à supprimer' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'La récolte a été supprimée avec succès.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Récolte non trouvée.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission refusée - Réservé aux formateurs' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.harvestService.remove(id);
  }
}