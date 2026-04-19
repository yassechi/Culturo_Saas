import { CreateWateringDTO } from './dtos/create.watering.dto';
import { UpdateWateringDTO } from './dtos/update.watering.dto';
import { Watering } from 'src/entities/watering.entity';
import { WateringService } from './watering.service';
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

@ApiTags('Waterings')
@Controller('waterings')
export class WateringController {
  constructor(private readonly wateringService: WateringService) {}

  /**
   * Récupérer tous les arrosages - Accessible aux utilisateurs authentifiés
   */
  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère tous les arrosages' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des arrosages',
    type: [Watering],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async findAll(): Promise<Watering[]> {
    return await this.wateringService.findAll();
  }

  /**
   * Récupérer un arrosage par ID - Accessible aux utilisateurs authentifiés
   */
  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère un arrosage par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'arrosage', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Arrosage trouvé', type: Watering })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Arrosage non trouvé' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Watering> {
    return await this.wateringService.findOne(id);
  }

  /**
   * Créer un nouvel arrosage - Accessible aux utilisateurs authentifiés
   */
  @Post()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Crée un nouvel arrosage' })
  @ApiBody({ type: CreateWateringDTO })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Arrosage créé', type: Watering })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async create(@Body() dto: CreateWateringDTO): Promise<Watering> {
    return await this.wateringService.create(dto);
  }

  /**
   * Mettre à jour un arrosage - Accessible aux utilisateurs authentifiés
   */
  @Patch(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Met à jour un arrosage existant' })
  @ApiParam({ name: 'id', description: 'ID de l\'arrosage', type: Number })
  @ApiBody({ type: UpdateWateringDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Arrosage mis à jour',
    type: Watering,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Arrosage non trouvé' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWateringDTO,
  ): Promise<Watering> {
    return await this.wateringService.update(id, dto);
  }

  /**
   * Supprimer un arrosage - Accessible aux utilisateurs authentifiés
   */
  @Delete(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un arrosage' })
  @ApiParam({ name: 'id', description: 'ID de l\'arrosage', type: Number })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Arrosage supprimé' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Arrosage non trouvé' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.wateringService.remove(id);
  }
}