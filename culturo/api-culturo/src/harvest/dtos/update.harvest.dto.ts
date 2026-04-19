import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHarvestDTO {
  @ApiPropertyOptional({ description: 'Date de la récolte' })
  @IsOptional()
  @IsDate()
  harvest_date?: Date;

  @ApiPropertyOptional({ description: 'Quantité récoltée' })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unité de la quantité (ex: kg, g)' })
  @IsOptional()
  @IsString()
  quantity_unit?: string;

  @ApiPropertyOptional({
    description: 'ID de l’utilisateur qui a fait la récolte',
  })
  @IsOptional()
  @IsNumber()
  id_user?: number;

  @ApiPropertyOptional({
    description: 'ID de la section où la récolte a été faite',
  })
  @IsOptional()
  @IsNumber()
  id_section?: number;
}
