import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWateringDTO {
  @ApiProperty({ description: 'Date et heure de l\'arrosage (ISO 8601)', example: '2026-05-11T09:30:00' })
  @IsString()
  @IsNotEmpty()
  watering_date: string;

  @ApiProperty({ description: 'ID de la section arrosée' })
  @IsNumber()
  @IsNotEmpty()
  id_section: number;
}

export class CreateBulkWateringDTO {
  @ApiProperty({ description: 'Date et heure de l\'arrosage (ISO 8601)', example: '2026-05-11T09:30:00' })
  @IsString()
  @IsNotEmpty()
  watering_date: string;

  @ApiProperty({ description: 'IDs de sections spécifiques', required: false })
  @IsOptional()
  section_ids?: number[];

  @ApiProperty({ description: 'Arroser toutes les sections actives d\'une planche', required: false })
  @IsOptional()
  @IsNumber()
  board_id?: number;

  @ApiProperty({ description: 'Arroser toutes les sections actives d\'une sole', required: false })
  @IsOptional()
  @IsNumber()
  sole_id?: number;
}
