import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';
import { VegetableService } from './vegetable.service';
import { CreateVegetableDTO } from './dtos/create.vegetable.dto';
import { UpdateVegetableDTO } from './dtos/update.vegetable.dto';
import { Vegetable } from 'src/entities/vegetable.entity';
import { Variety } from 'src/entities/variety.entity';
import { AuthChard } from 'src/users/guards/auth.guard';
import { PermissionsGuard } from 'src/users/guards/permissions.guard';
import { RequiertPermissions } from 'src/users/decorators/permissions.decorator';
import { Permission } from 'src/users/permissions/permission.enum';

@ApiTags('Vegetables')
@Controller('vegetables')
export class VegetableController {
  constructor(private readonly vegetableService: VegetableService) {}

  /**
   * Récupérer tous les légumes - Accessible aux utilisateurs authentifiés
   */
  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère tous les légumes' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des légumes',
    type: [Vegetable],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async getAllVegetables() {
    return this.vegetableService.getAllVegetables();
  }

  /**
   * Récupérer un légume par ID - Accessible aux utilisateurs authentifiés
   */
  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère un légume par son ID' })
  @ApiParam({ name: 'id', description: 'ID du légume', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Légume récupéré',
    type: Vegetable,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Légume non trouvé' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async getVegetableById(@Param('id', ParseIntPipe) id: number) {
    return this.vegetableService.getVegetableById(id);
  }

  /**
   * Récupérer les variétés d'un légume - Accessible aux utilisateurs authentifiés
   */
  @Get(':id/varieties')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère toutes les variétés d\'un légume' })
  @ApiParam({ name: 'id', description: 'ID du légume', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des variétés',
    type: [Variety],
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Légume non trouvé' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async getVarietiesVegetable(@Param('id', ParseIntPipe) id: number) {
    return this.vegetableService.getVarietiesVegetable(id);
  }

  /**
   * Créer un légume - FORMATEUR uniquement
   */
  @Post()
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.CREER_LEGUME)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Crée un nouveau légume' })
  @ApiBody({ type: CreateVegetableDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Légume créé',
    type: Vegetable,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permission refusée - Réservé aux formateurs',
  })
  async createVegetable(@Body() payload: CreateVegetableDTO) {
    return this.vegetableService.createVegetable(payload);
  }

  /**
   * Mettre à jour un légume - FORMATEUR uniquement
   */
  @Put()
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.MODIFIER_SUPPRIMER_LEGUME)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Met à jour un légume existant' })
  @ApiBody({ type: UpdateVegetableDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Légume mis à jour',
    type: Vegetable,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Légume non trouvé' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permission refusée - Réservé aux formateurs',
  })
  async updateVegetable(@Body() payload: UpdateVegetableDTO) {
    return this.vegetableService.updateVegetable(payload);
  }

  /**
   * Supprimer un légume - FORMATEUR uniquement
   */
  @Delete(':id')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.MODIFIER_SUPPRIMER_LEGUME)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un légume par son ID' })
  @ApiParam({ name: 'id', description: 'ID du légume', type: Number })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Légume supprimé' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Légume non trouvé' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permission refusée - Réservé aux formateurs',
  })
  async deleteVegetable(@Param('id', ParseIntPipe) id: number) {
    return this.vegetableService.delVegetable(id);
  }
}