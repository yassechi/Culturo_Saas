import { CreateOrderDTO } from './dtos/create.order.dto';
import { UpdateOrderDTO } from './dtos/update.order.dto';
import { Order } from 'src/entities/order.entity';
import { OrderService } from './order.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { AuthChard } from '../users/guards/auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { RequiertPermissions } from '../users/decorators/permissions.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Récupérer toutes les commandes - Accessible aux utilisateurs authentifiés
   */
  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère toutes les commandes' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des commandes',
    type: [Order],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async findAll(): Promise<Order[]> {
    return this.orderService.findAll();
  }

  /**
   * Récupérer une commande par ID - Accessible aux utilisateurs authentifiés
   */
  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Récupère une commande par son ID' })
  @ApiParam({ name: 'id', description: 'ID de la commande', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Commande trouvée', type: Order })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Commande non trouvée' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.orderService.findOne(id);
  }

  /**
   * Créer une nouvelle commande - Accessible aux utilisateurs authentifiés
   */
  @Post()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Crée une nouvelle commande' })
  @ApiBody({ type: CreateOrderDTO })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Commande créée', type: Order })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async create(@Body() dto: CreateOrderDTO): Promise<Order> {
    return this.orderService.create(dto);
  }

  /**
   * Mettre à jour une commande - Accessible aux utilisateurs authentifiés
   */
  @Patch(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Met à jour une commande existante' })
  @ApiParam({ name: 'id', description: 'ID de la commande', type: Number })
  @ApiBody({ type: UpdateOrderDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commande mise à jour',
    type: Order,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Commande non trouvée' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDTO,
  ): Promise<Order> {
    return this.orderService.update(id, dto);
  }

  /**
   * Supprimer une commande - Accessible aux utilisateurs authentifiés
   */
  @Delete(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande', type: Number })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Commande supprimée' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Commande non trouvée' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Non authentifié' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.orderService.remove(id);
  }
}