import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Post, Put, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiSecurity } from '@nestjs/swagger';
import { AmendedService } from './amendement.service';
import { CreateAmendementDTO, CreateBulkAmendementDTO } from './dtos/create.amendement.dto';
import { CreateCatalogueDTO, UpdateCatalogueDTO } from './dtos/catalogue.dto';
import { Amended } from '../entities/amended.entity';
import { Amendement } from '../entities/amendement.entity';
import { AuthChard } from '../users/guards/auth.guard';

// ── Catalogue des produits ────────────────────────────────────────────────────

@ApiTags('Amendements — Catalogue')
@Controller('amendements/catalogue')
export class CatalogueController {
  constructor(private readonly amendedService: AmendedService) {}

  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Liste tous les produits du catalogue' })
  @ApiResponse({ status: 200, type: [Amendement] })
  async findAll(): Promise<Amendement[]> {
    return this.amendedService.findAllCatalogue();
  }

  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère un produit du catalogue par ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Amendement })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Amendement> {
    return this.amendedService.findCatalogueById(id);
  }

  @Post()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Crée un produit dans le catalogue' })
  @ApiBody({ type: CreateCatalogueDTO })
  @ApiResponse({ status: 201, type: Amendement })
  async create(@Body() dto: CreateCatalogueDTO): Promise<Amendement> {
    return this.amendedService.createCatalogue(dto);
  }

  @Put(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Met à jour un produit du catalogue' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCatalogueDTO })
  @ApiResponse({ status: 200, type: Amendement })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogueDTO,
  ): Promise<Amendement> {
    return this.amendedService.updateCatalogue(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un produit du catalogue' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Supprimé' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.amendedService.removeCatalogue(id);
  }
}

// ── Applications d'amendements ────────────────────────────────────────────────

@ApiTags('Amendements — Applications')
@Controller('amendements')
export class AmendedController {
  constructor(private readonly amendedService: AmendedService) {}

  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère toutes les applications d\'amendement' })
  @ApiResponse({ status: 200, type: [Amended] })
  async findAll(): Promise<Amended[]> {
    return this.amendedService.findAll();
  }

  @Get('board/:boardId')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère les amendements d\'une planche' })
  @ApiParam({ name: 'boardId', type: Number })
  @ApiResponse({ status: 200, type: [Amended] })
  async findByBoard(@Param('boardId', ParseIntPipe) boardId: number): Promise<Amended[]> {
    return this.amendedService.findByBoard(boardId);
  }

  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère une application par ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Amended })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Amended> {
    return this.amendedService.findById(id);
  }

  @Post()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Enregistre un amendement pour une planche' })
  @ApiBody({ type: CreateAmendementDTO })
  @ApiResponse({ status: 201, type: Amended })
  async create(@Body() dto: CreateAmendementDTO): Promise<Amended> {
    return this.amendedService.create(dto);
  }

  @Post('bulk')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Amende toutes les planches actives d\'une sole' })
  @ApiBody({ type: CreateBulkAmendementDTO })
  @ApiResponse({ status: 201, type: [Amended] })
  async createBulk(@Body() dto: CreateBulkAmendementDTO): Promise<Amended[]> {
    return this.amendedService.createBulk(dto);
  }

  @Put(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Met à jour une application d\'amendement' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateAmendementDTO })
  @ApiResponse({ status: 200, type: Amended })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateAmendementDTO>,
  ): Promise<Amended> {
    return this.amendedService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime une application d\'amendement' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Supprimé' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.amendedService.remove(id);
  }
}
