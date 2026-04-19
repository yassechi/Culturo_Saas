import { CreateTreatedDTO } from './dtos/create.treatment.dto';
import { UpdateTreatedDTO } from './dtos/update.treatment.dto';
import { Treated } from 'src/entities/treated.entity';
import { TreatedService } from './treatment.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { AuthChard } from '../users/guards/auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequiertPermissions } from '../users/decorators/permissions.decorator';

@ApiTags('Treated')
@Controller('treated')
export class TreatedController {
  constructor(private readonly treatedService: TreatedService) {}

  /**
   * Récupérer tous les traitements - Accessible aux utilisateurs authentifiés
   */
  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère tous les traitements appliqués' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des traitements',
    type: [Treated],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async findAll(): Promise<Treated[]> {
    return await this.treatedService.findAll();
  }

  /**
   * Récupérer un traitement par ID - Accessible aux utilisateurs authentifiés
   */
  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère un traitement par son ID' })
  @ApiParam({ name: 'id', description: 'ID du traitement', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Traitement trouvé', type: Treated })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Traitement non trouvé' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Treated> {
    return await this.treatedService.findOne(id);
  }

  /**
   * Créer un nouveau traitement - Accessible aux utilisateurs authentifiés
   */
  @Post()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Crée un nouveau traitement appliqué' })
  @ApiBody({ type: CreateTreatedDTO })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Traitement créé', type: Treated })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async create(@Body() dto: CreateTreatedDTO): Promise<Treated> {
    return await this.treatedService.create(dto);
  }

  /**
   * Mettre à jour un traitement - Accessible aux utilisateurs authentifiés
   */
  @Patch(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Met à jour un traitement appliqué' })
  @ApiParam({ name: 'id', description: 'ID du traitement', type: Number })
  @ApiBody({ type: UpdateTreatedDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Traitement mis à jour',
    type: Treated,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Traitement non trouvé' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTreatedDTO,
  ): Promise<Treated> {
    return await this.treatedService.update(id, dto);
  }

  /**
   * Supprimer un traitement - Accessible aux utilisateurs authentifiés
   */
  @Delete(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un traitement appliqué' })
  @ApiParam({ name: 'id', description: 'ID du traitement', type: Number })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Traitement supprimé' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Traitement non trouvé' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.treatedService.remove(id);
  }
}