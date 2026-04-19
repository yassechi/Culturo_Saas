import { UpdateFamilyDTO } from './dtos/update.family.dto';
import { CreateFamilyDTO } from './dtos/create.family.dto';
import { FamilyService } from './family.service';

import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiSecurity,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthChard } from 'src/users/guards/auth.guard';
import { PermissionsGuard } from 'src/users/guards/permissions.guard';
import { RequiertPermissions } from 'src/users/decorators/permissions.decorator';
import { Permission } from 'src/users/permissions/permission.enum';
import { Family } from 'src/entities/family.entity';

@ApiTags('Families')
@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  /**
   * Récupérer toutes les familles - Accessible aux utilisateurs authentifiés
   */
  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère toutes les familles de légumes' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des familles', type: [Family] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  public async getAllFamilies() {
    return this.familyService.getAllFamilies();
  }

  /**
   * Récupérer toutes les importances - Accessible aux utilisateurs authentifiés
   */
  @Get('importances')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère toutes les importances de familles' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des importances' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  public async getAllImportance() {
    return this.familyService.getAllImportance();
  }

  /**
   * Récupérer une famille par ID - Accessible aux utilisateurs authentifiés
   */
  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère une famille par son ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la famille' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Famille trouvée', type: Family })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Famille non trouvée' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  public async getFamily(@Param('id', ParseIntPipe) id: number) {
    return this.familyService.getFamilyById(id);
  }

  /**
   * Créer une famille - FORMATEUR uniquement
   */
  @Post()
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.CREER_FAMILLE_LEGUME)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Crée une nouvelle famille de légumes' })
  @ApiBody({ type: CreateFamilyDTO })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Famille créée', type: Family })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission refusée - Réservé aux formateurs' })
  public async createFamily(@Body() payload: CreateFamilyDTO) {
    return this.familyService.createFamily(payload);
  }

  /**
   * Mettre à jour une famille - FORMATEUR uniquement
   */
  @Put()
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.MODIFIER_SUPPRIMER_FAMILLE_LEGUME)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Met à jour une famille de légumes' })
  @ApiBody({ type: UpdateFamilyDTO })
  @ApiResponse({ status: HttpStatus.OK, description: 'Famille mise à jour', type: Family })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Famille non trouvée' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission refusée - Réservé aux formateurs' })
  public async updateFamily(@Body() payload: UpdateFamilyDTO) {
    return this.familyService.updateFamily(payload);
  }

  /**
   * Supprimer une famille - FORMATEUR uniquement
   */
  @Delete(':id')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.MODIFIER_SUPPRIMER_FAMILLE_LEGUME)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime une famille de légumes' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la famille à supprimer' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Famille supprimée' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Famille non trouvée' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permission refusée - Réservé aux formateurs' })
  public async delFamily(@Param('id', ParseIntPipe) id: number) {
    return this.familyService.delFamily(id);
  }
}