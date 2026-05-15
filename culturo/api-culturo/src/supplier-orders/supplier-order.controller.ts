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
import { SupplierOrderService } from './supplier-order.service';
import { CreateSupplierOrderDto, CreateSupplierOrderItemDto } from './dtos/create.supplier-order.dto';
import { UpdateSupplierOrderDto } from './dtos/update.supplier-order.dto';
import { AuthChard } from 'src/users/guards/auth.guard';

@ApiTags('Supplier Orders')
@Controller('supplier-orders')
export class SupplierOrderController {
  constructor(private readonly supplierOrderService: SupplierOrderService) {}

  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Liste toutes les commandes fournisseurs' })
  @ApiResponse({ status: 200, description: 'Liste des commandes' })
  findAll() {
    return this.supplierOrderService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Détails d\'une commande fournisseur' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Commande trouvée' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supplierOrderService.findOne(id);
  }

  @Post()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Créer une commande fournisseur' })
  @ApiBody({ type: CreateSupplierOrderDto })
  @ApiResponse({ status: 201, description: 'Commande créée' })
  create(@Body() dto: CreateSupplierOrderDto) {
    return this.supplierOrderService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Modifier une commande (statut, dates, notes)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateSupplierOrderDto })
  @ApiResponse({ status: 200, description: 'Commande mise à jour' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierOrderDto,
  ) {
    return this.supplierOrderService.update(id, dto);
  }

  @Post(':id/items')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Ajouter une ligne à une commande' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateSupplierOrderItemDto })
  @ApiResponse({ status: 201, description: 'Ligne ajoutée' })
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSupplierOrderItemDto,
  ) {
    return this.supplierOrderService.addItem(id, dto);
  }

  @Delete('items/:itemId')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une ligne de commande' })
  @ApiParam({ name: 'itemId', type: Number })
  @ApiResponse({ status: 204, description: 'Ligne supprimée' })
  async removeItem(@Param('itemId', ParseIntPipe) itemId: number): Promise<void> {
    await this.supplierOrderService.removeItem(itemId);
  }

  @Delete(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une commande fournisseur' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Commande supprimée' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.supplierOrderService.remove(id);
  }
}
