import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDTO {
  @ApiProperty({ description: 'Date de la commande' })
  @IsDate()
  @IsNotEmpty()
  order_date: Date;

  @ApiProperty({ description: 'Date de livraison prévue' })
  @IsDate()
  @IsNotEmpty()
  order_delivery: Date;

  @ApiProperty({ description: 'ID de l’utilisateur qui passe la commande' })
  @IsNumber()
  @IsNotEmpty()
  id_user: number;
}
