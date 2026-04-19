import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiSecurity,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { VarietyService } from './variety.service';
import { CreateVarietyDTO } from './dtos/create.vartiety.dto';
import { UpdateVarietyDTO } from './dtos/update.variety.dto';
import { Variety } from 'src/entities/variety.entity';
import { AuthChard } from 'src/users/guards/auth.guard';
import { PermissionsGuard } from 'src/users/guards/permissions.guard';
import { Permission } from 'src/users/permissions/permission.enum';
import { RequiertPermissions } from 'src/users/decorators/permissions.decorator';


@ApiTags('Varieties')
@Controller('varieties')
export class VarietyController {
  constructor(private readonly varietyService: VarietyService) {}

  /**
   * Récupérer les variétés par ID de légume - Accessible aux utilisateurs authentifiés
   */
  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère les variétés par ID de légume' })
  @ApiQuery({ name: 'vegetable_id', type: Number, description: 'ID du légume' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des variétés', type: [Variety] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  public async getVarietyByVegetableId(
    @Query('vegetable_id', ParseIntPipe) vegetableId: number,
  ) {
    return this.varietyService.geteAllVarietiesByVegetableId(vegetableId);
  }

  /**
   * Récupérer une variété par ID - Accessible aux utilisateurs authentifiés
   */
  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère une variété par son ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la variété' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Variété trouvée', type: Variety })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Variété non trouvée' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  public async getVariety(@Param('id', ParseIntPipe) id: number) {
    return this.varietyService.getVarietyById(id);
  }

  /**
   * Récupérer les variétés d'un légume - Accessible aux utilisateurs authentifiés
   */
  @Get(':id/varieties')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère toutes les variétés d\'un légume' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du légume' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des variétés du légume', type: [Variety] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Légume non trouvé' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async getVarieties(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Variety[]> {
    const vegetable = await this.varietyService.getVarietiesVegetable(id);

    if (!vegetable) {
      throw new NotFoundException(`Vegetable with ID ${id} not found`);
    }

    return vegetable;
  }

  /**
   * Créer une variété - FORMATEUR uniquement
   */
  @Post()
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.CREER_VARIETE_LEGUME)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Crée une nouvelle variété de légume' })
  @ApiBody({ type: CreateVarietyDTO })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Variété créée', type: Variety })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission refusée - Réservé aux formateurs' })
  public async createVariety(@Body() payload: CreateVarietyDTO) {
    return this.varietyService.createvariety(payload);
  }

  /**
   * Mettre à jour une variété - FORMATEUR uniquement
   */
  @Put()
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.MODIFIER_SUPPRIMER_VARIETE_LEGUME)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Met à jour une variété de légume' })
  @ApiBody({ type: UpdateVarietyDTO })
  @ApiResponse({ status: HttpStatus.OK, description: 'Variété mise à jour', type: Variety })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Variété non trouvée' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission refusée - Réservé aux formateurs' })
  public async updateVariety(@Body() payload: UpdateVarietyDTO) {
    return this.varietyService.updateVariety(payload);
  }

  /**
   * Supprimer une variété - FORMATEUR uniquement
   */
  @Delete(':id')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.MODIFIER_SUPPRIMER_VARIETE_LEGUME)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime une variété de légume' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la variété à supprimer' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Variété supprimée' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Variété non trouvée' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission refusée - Réservé aux formateurs' })
  public async delVariety(@Param('id', ParseIntPipe) id: number) {
    return this.varietyService.delVariety(id);
  }
}