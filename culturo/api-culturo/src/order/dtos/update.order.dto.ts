import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderDTO {
  @ApiPropertyOptional({ description: 'Date de la commande' })
  @IsOptional()
  @IsDate()
  order_date?: Date;

  @ApiPropertyOptional({ description: 'Date de livraison prévue' })
  @IsOptional()
  @IsDate()
  order_delivery?: Date;

  @ApiPropertyOptional({ description: 'ID de l’utilisateur' })
  @IsOptional()
  @IsNumber()
  id_user?: number;
}
