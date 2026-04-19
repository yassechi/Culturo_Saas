// src/amendement/dtos/create.amendement.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsNumber } from 'class-validator';

export class CreateAmendementDTO {
  @ApiProperty({ example: 'Ajout de compost' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Amendement organique pour le sol' })
  @IsString()
  description: string;

  @ApiProperty({ example: '2025-12-14T00:00:00.000Z' })
  @IsDateString()
  amendment_date: Date;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  id_board?: number;
}