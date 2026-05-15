import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreatePlantStockDto {
  @ApiProperty({ example: 3, description: 'ID du légume' })
  @IsInt()
  @IsNotEmpty()
  id_vegetable: number;

  @ApiPropertyOptional({ example: 5, description: 'ID de la variété (optionnel)' })
  @IsOptional()
  @IsInt()
  id_variety?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de l\'exploitation (optionnel)' })
  @IsOptional()
  @IsInt()
  id_exploitation?: number;

  @ApiProperty({ example: 50, description: 'Quantité en stock' })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ example: 'plants', enum: ['plants', 'graines', 'kg'], default: 'plants' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: '2026-05-10' })
  @IsOptional()
  @IsDateString()
  received_date?: string;

  @ApiPropertyOptional({ example: 'Lot printemps 2026' })
  @IsOptional()
  @IsString()
  notes?: string;
}
