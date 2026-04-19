import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTreatedDTO {
  @ApiProperty({ description: 'Date du traitement' })
  @IsDate()
  @IsNotEmpty()
  treatment_date: Date;

  @ApiProperty({ description: 'Quantité appliquée lors du traitement' })
  @IsNumber()
  @IsNotEmpty()
  treatment_quantity: number;

  @ApiProperty({ description: 'Unité de la quantité (ex: ml, g)' })
  @IsString()
  @IsNotEmpty()
  treatment_unit: string;

  @ApiProperty({ description: 'ID de la planche traitée' })
  @IsNumber()
  @IsNotEmpty()
  id_board: number;

  @ApiProperty({ description: 'ID du traitement appliqué' })
  @IsNumber()
  @IsNotEmpty()
  id_treatment: number;
}
