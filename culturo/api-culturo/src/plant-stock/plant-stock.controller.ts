import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { PlantStockService } from './plant-stock.service';
import { CreatePlantStockDto } from './dtos/create.plant-stock.dto';
import { UpdatePlantStockDto } from './dtos/update.plant-stock.dto';
import { AuthChard } from 'src/users/guards/auth.guard';

@ApiTags('Plant Stock')
@Controller('plant-stock')
export class PlantStockController {
  constructor(private readonly plantStockService: PlantStockService) {}

  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Liste le stock de plants' })
  @ApiQuery({ name: 'exploitationId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste du stock' })
  findAll(@Query('exploitationId') exploitationId?: string) {
    return this.plantStockService.findAll(
      exploitationId ? Number(exploitationId) : undefined,
    );
  }

  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Détails d\'une entrée de stock' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Entrée de stock' })
  @ApiResponse({ status: 404, description: 'Introuvable' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.plantStockService.findOne(id);
  }

  @Post()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Ajouter du stock de plants' })
  @ApiBody({ type: CreatePlantStockDto })
  @ApiResponse({ status: 201, description: 'Stock créé' })
  create(@Body() dto: CreatePlantStockDto) {
    return this.plantStockService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Modifier une entrée de stock' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdatePlantStockDto })
  @ApiResponse({ status: 200, description: 'Stock mis à jour' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlantStockDto,
  ) {
    return this.plantStockService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une entrée de stock' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Stock supprimé' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.plantStockService.remove(id);
  }
}
