import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  BadRequestException,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RotationService } from './rotation.service';
import { Vegetable } from 'src/entities/vegetable.entity';
import { PlantingValidationDto } from '../dtos/planting.validation.dto';
import { CulturePlanQueryDto } from '../dtos/culture.plan.query.dto';
import { PlantableVegetableDto } from '../dtos/plantable.vegetable.dro';
import { AddVegetableToBoardDto } from '../dtos/add.vegetable.section';
import { PlantingSuccessResponse } from '../dtos/planting.succes.warning.dto';
import { Section } from 'src/entities/section.entity';
import { SectionPlan } from 'src/entities/section_plan.entity';
import { AuthChard } from 'src/users/guards/auth.guard';

/**
 * Définit la structure de la réponse du service après une tentative de plantation.
 */
export interface PlantingResult {
  status: 'OK' | 'WARNING';
  section?: Section;
  reason?: string;
  neededBypass?: boolean;
}

/**
 * Définit la structure de la réponse de création/activation de plan.
 */
export interface PlanResult {
  sectionPlan: SectionPlan;
  status: 'CREATED' | 'FOUND';
}

@ApiTags('Rotations')
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('rotations')
export class RotationController {
  constructor(private readonly rotationService: RotationService) {}

  /**
   * Obtenir le plan de culture - Accessible aux utilisateurs authentifiés
   */
  @Get('plan/:soleId')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({
    summary: 'Obtient le plan de culture pour une Sole sur une période donnée',
  })
  @ApiParam({
    name: 'soleId',
    type: Number,
    description: 'ID de la Sole',
    example: 1,
  })
  @ApiQuery({ name: 'year', type: Number, required: true, example: 2025 })
  @ApiQuery({ name: 'month', type: Number, required: false, example: 3 })
  @ApiQuery({ name: 'periodMonths', type: Number, required: false, example: 6 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan de culture retourné avec succès',
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non authentifié',
  })
  async getCulturePlan(
    @Param('soleId', ParseIntPipe) soleId: number,
    @Query() query: CulturePlanQueryDto,
  ) {
    const { year, month, periodMonths } = query;
    return this.rotationService.getCulturePlan(
      soleId,
      year,
      month ?? null,
      periodMonths,
    );
  }

  /**
   * Vérifier si un légume peut être planté - Accessible aux utilisateurs authentifiés
   */
  @Post('can')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({
    summary: 'Vérifie si un légume peut être planté sur une planche',
    description:
      'Vérifie les règles de rotation (5 ans) et de cohabitation (famille primaire unique)',
  })
  @ApiBody({
    type: PlantingValidationDto,
    description:
      "Contient l'ID de la planche, l'ID du légume, et un drapeau pour contourner les règles (bypass)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plantation autorisée (Statut: OK)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non authentifié',
  })
  async canPlantVegetable(@Body() body: PlantingValidationDto) {
    return this.rotationService.canPlantVegetable(
      body.boardId,
      body.vegetableId,
      !!body.bypass,
    );
  }

  /**
   * Trouver les sections plantables - Accessible aux utilisateurs authentifiés
   */
  @Get('plantable-sections')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({
    summary: 'Trouve toutes les sections plantables pour un légume donné',
  })
  @ApiQuery({ name: 'vegetableId', type: Number, required: true, example: 21 })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: true,
    example: '2025-03-01',
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: true,
    example: '2025-07-31',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des sections disponibles pour la plantation',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non authentifié',
  })
  async findPlantableSections(
    @Query('vegetableId', ParseIntPipe) vegetableId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      throw new BadRequestException('Dates invalides ou incohérentes');
    }
    return this.rotationService.findPlantableSections(vegetableId, start, end);
  }

  /**
   * Trouver les légumes plantables - Accessible aux utilisateurs authentifiés
   */
  @Get('plantable-vegetables')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({
    summary: 'Récupère les légumes plantables dans une section spécifique',
  })
  @ApiQuery({ name: 'sectionPlanId', type: Number, example: 3 })
  @ApiQuery({ name: 'sectionNumber', type: Number, example: 2 })
  @ApiQuery({ name: 'startDate', type: String, example: '2024-03-15' })
  @ApiQuery({ name: 'endDate', type: String, example: '2024-09-30' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des légumes plantables',
    type: [PlantableVegetableDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non authentifié',
  })
  async findPlantableVegetables(
    @Query('sectionPlanId', ParseIntPipe) sectionPlanId: number,
    @Query('sectionNumber', ParseIntPipe) sectionNumber: number,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ): Promise<PlantableVegetableDto[]> {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      throw new BadRequestException('Dates invalides ou incohérentes');
    }
    return this.rotationService.findPlantableVegetables(
      sectionPlanId,
      sectionNumber,
      start,
      end,
    );
  }

  /**
   * Créer un plan de section - Accessible aux utilisateurs authentifiés
   */
  @Post('plan-section')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Crée un nouveau SectionPlan pour une planche ou active/retourne un plan existant',
  })
  @ApiQuery({
    name: 'boardId',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'numberOfSections',
    type: Number,
    required: false,
    example: 3,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan de section trouvé ou créé avec succès',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non authentifié',
  })
  async createSectionPlan(
    @Query('boardId', ParseIntPipe) boardId: number,
    @Query('numberOfSections', new ParseIntPipe({ optional: true }))
    initialSections?: number,
  ): Promise<PlanResult> {
    try {
      const numberOfSections = initialSections ?? 4;

      if (numberOfSections <= 0) {
        throw new BadRequestException(
          'Le paramètre numberOfSections doit être un nombre entier positif',
        );
      }

      return await this.rotationService.createOrActivatePlan(
        boardId,
        numberOfSections,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur interne lors de la gestion du plan de section',
      );
    }
  }

  /**
   * Ajouter un légume à une planche - Accessible aux utilisateurs authentifiés
   */
  @Post('add-vegetable')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({
    summary: 'Ajoute un légume (avec variété) à une section de planche',
  })
  @ApiQuery({
    name: 'numberOfSection',
    type: Number,
    required: false,
    example: 3,
  })
  @ApiBody({
    type: AddVegetableToBoardDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Section créée avec succès',
    type: PlantingSuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non authentifié',
  })
  async addVegetableToBoard(
    @Body() dto: AddVegetableToBoardDto,
    @Query('numberOfSection', new ParseIntPipe({ optional: true }))
    numberOfSection?: number,
  ): Promise<PlantingResult> {
    const {
      boardId,
      sectionNumber,
      vegetableId,
      startDate,
      endDate,
      quantityPlanted,
      unity,
      varietyIdentifier,
      bypass,
    } = dto;

    const sectionsToCreate = numberOfSection ?? 3;

    try {
      const result = await this.rotationService.addVegetableToBoard(
        boardId,
        sectionNumber,
        vegetableId,
        startDate,
        endDate,
        quantityPlanted,
        bypass || false,
        unity,
        varietyIdentifier,
        sectionsToCreate,
      );

      if (result.status === 'WARNING') {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            result.reason ||
            'Violation des règles de rotation. Contournement requis',
          warningDetails: result,
        });
      }

      return result;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        if (
          error instanceof BadRequestException &&
          (error.getResponse() as any)?.warningDetails
        ) {
          throw error;
        }
        throw error;
      }

      console.error(
        "Erreur interne lors de l'ajout du légume à la planche :",
        error,
      );
      throw new InternalServerErrorException(
        'Une erreur interne est survenue lors de la création de la section',
      );
    }
  }
}
