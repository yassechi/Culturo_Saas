import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';

export class CreateAmendementDTO {
  @ApiProperty({ description: 'Date de l\'application (YYYY-MM-DD)', example: '2026-05-11' })
  @IsString()
  @IsNotEmpty()
  amendment_date: string;

  @ApiProperty({ description: 'ID du type d\'amendement (catalogue)', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id_amendement: number;

  @ApiProperty({ description: 'ID de la planche', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id_board: number;

  @ApiProperty({ description: 'Quantité appliquée', example: 2.5, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @ApiProperty({ description: 'Unité de mesure', example: 'kg', required: false })
  @IsOptional()
  @IsString()
  quantity_unit?: string;

  @ApiProperty({ description: 'Notes libres', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateBulkAmendementDTO {
  @ApiProperty({ description: 'Date de l\'application (YYYY-MM-DD)', example: '2026-05-11' })
  @IsString()
  @IsNotEmpty()
  amendment_date: string;

  @ApiProperty({ description: 'ID du type d\'amendement (catalogue)', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id_amendement: number;

  @ApiProperty({ description: 'ID de la sole (toutes les planches actives)', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id_sole: number;

  @ApiProperty({ description: 'Quantité appliquée par planche', example: 2.5, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @ApiProperty({ description: 'Unité de mesure', example: 'kg', required: false })
  @IsOptional()
  @IsString()
  quantity_unit?: string;

  @ApiProperty({ description: 'Notes libres', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
