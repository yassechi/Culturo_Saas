import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTreatedDTO {
  @ApiPropertyOptional({ description: 'Date du traitement' })
  @IsOptional()
  @IsDate()
  treatment_date?: Date;

  @ApiPropertyOptional({ description: 'Quantité appliquée lors du traitement' })
  @IsOptional()
  @IsNumber()
  treatment_quantity?: number;

  @ApiPropertyOptional({ description: 'Unité de la quantité (ex: ml, g)' })
  @IsOptional()
  @IsString()
  treatment_unit?: string;

  @ApiPropertyOptional({ description: 'ID de la planche traitée' })
  @IsOptional()
  @IsNumber()
  boardId?: number;

  @ApiPropertyOptional({ description: 'ID du traitement appliqué' })
  @IsOptional()
  @IsNumber()
  treatmentId?: number;
}
