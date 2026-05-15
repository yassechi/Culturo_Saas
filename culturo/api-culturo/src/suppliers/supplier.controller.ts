import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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
} from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dtos/create.supplier.dto';
import { UpdateSupplierDto } from './dtos/update.supplier.dto';
import { AuthChard } from 'src/users/guards/auth.guard';

@ApiTags('Suppliers')
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Liste tous les fournisseurs' })
  @ApiResponse({ status: 200, description: 'Liste des fournisseurs' })
  findAll() {
    return this.supplierService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Détails d\'un fournisseur' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Fournisseur trouvé' })
  @ApiResponse({ status: 404, description: 'Fournisseur introuvable' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.findOne(id);
  }

  @Post()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Créer un fournisseur' })
  @ApiBody({ type: CreateSupplierDto })
  @ApiResponse({ status: 201, description: 'Fournisseur créé' })
  create(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Modifier un fournisseur' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateSupplierDto })
  @ApiResponse({ status: 200, description: 'Fournisseur mis à jour' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.supplierService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un fournisseur' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Fournisseur supprimé' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.supplierService.remove(id);
  }
}
