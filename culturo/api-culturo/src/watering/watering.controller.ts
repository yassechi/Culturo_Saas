import { CreateWateringDTO, CreateBulkWateringDTO } from './dtos/create.watering.dto';
import { UpdateWateringDTO } from './dtos/update.watering.dto';
import { Watering } from 'src/entities/watering.entity';
import { WateringService } from './watering.service';
import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Patch, Post, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiSecurity } from '@nestjs/swagger';
import { AuthChard } from '../users/guards/auth.guard';

@ApiTags('Waterings')
@Controller('waterings')
export class WateringController {
  constructor(private readonly wateringService: WateringService) {}

  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère tous les arrosages' })
  @ApiResponse({ status: 200, type: [Watering] })
  async findAll(): Promise<Watering[]> {
    return this.wateringService.findAll();
  }

  @Get('section/:sectionId')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère les arrosages d\'une section' })
  @ApiParam({ name: 'sectionId', type: Number })
  @ApiResponse({ status: 200, type: [Watering] })
  async findBySection(@Param('sectionId', ParseIntPipe) sectionId: number): Promise<Watering[]> {
    return this.wateringService.findBySection(sectionId);
  }

  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère un arrosage par ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Watering })
  @ApiResponse({ status: 404, description: 'Non trouvé' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Watering> {
    return this.wateringService.findOne(id);
  }

  @Post()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Crée un arrosage pour une section' })
  @ApiBody({ type: CreateWateringDTO })
  @ApiResponse({ status: 201, type: Watering })
  async create(@Body() dto: CreateWateringDTO): Promise<Watering> {
    return this.wateringService.create(dto);
  }

  @Post('bulk')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Crée des arrosages en masse (planche ou sole entière)' })
  @ApiBody({ type: CreateBulkWateringDTO })
  @ApiResponse({ status: 201, type: [Watering] })
  async createBulk(@Body() dto: CreateBulkWateringDTO): Promise<Watering[]> {
    return this.wateringService.createBulk(dto);
  }

  @Patch(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Met à jour un arrosage' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateWateringDTO })
  @ApiResponse({ status: 200, type: Watering })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWateringDTO): Promise<Watering> {
    return this.wateringService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un arrosage' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Supprimé' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.wateringService.remove(id);
  }
}
