import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Post, Put, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiSecurity } from '@nestjs/swagger';
import { TreatedService } from './treatment.service';
import {
  CreateTreatedDTO, CreateBulkTreatedDTO,
  CreateTreatmentCatalogueDTO, UpdateTreatmentCatalogueDTO,
} from './dtos/create.treatment.dto';
import { Treated } from 'src/entities/treated.entity';
import { Treatment } from 'src/entities/treatment.entity';
import { AuthChard } from '../users/guards/auth.guard';

@ApiTags('Traitements — Catalogue')
@Controller('treated/catalogue')
export class TreatmentCatalogueController {
  constructor(private readonly treatedService: TreatedService) {}

  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Liste tous les types de traitement' })
  @ApiResponse({ status: 200, type: [Treatment] })
  async findAll(): Promise<Treatment[]> {
    return this.treatedService.findAllCatalogue();
  }

  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Treatment })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Treatment> {
    return this.treatedService.findCatalogueById(id);
  }

  @Post()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiBody({ type: CreateTreatmentCatalogueDTO })
  @ApiResponse({ status: 201, type: Treatment })
  async create(@Body() dto: CreateTreatmentCatalogueDTO): Promise<Treatment> {
    return this.treatedService.createCatalogue(dto);
  }

  @Put(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateTreatmentCatalogueDTO })
  @ApiResponse({ status: 200, type: Treatment })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTreatmentCatalogueDTO,
  ): Promise<Treatment> {
    return this.treatedService.updateCatalogue(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.treatedService.removeCatalogue(id);
  }
}

@ApiTags('Traitements — Applications')
@Controller('treated')
export class TreatedController {
  constructor(private readonly treatedService: TreatedService) {}

  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère tous les traitements appliqués' })
  @ApiResponse({ status: 200, type: [Treated] })
  async findAll(): Promise<Treated[]> {
    return this.treatedService.findAll();
  }

  @Get('board/:boardId')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiParam({ name: 'boardId', type: Number })
  @ApiResponse({ status: 200, type: [Treated] })
  async findByBoard(@Param('boardId', ParseIntPipe) boardId: number): Promise<Treated[]> {
    return this.treatedService.findByBoard(boardId);
  }

  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Treated })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Treated> {
    return this.treatedService.findOne(id);
  }

  @Post()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiBody({ type: CreateTreatedDTO })
  @ApiResponse({ status: 201, type: Treated })
  async create(@Body() dto: CreateTreatedDTO): Promise<Treated> {
    return this.treatedService.create(dto);
  }

  @Post('bulk')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiBody({ type: CreateBulkTreatedDTO })
  @ApiResponse({ status: 201, type: [Treated] })
  async createBulk(@Body() dto: CreateBulkTreatedDTO): Promise<Treated[]> {
    return this.treatedService.createBulk(dto);
  }

  @Delete(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.treatedService.remove(id);
  }
}
