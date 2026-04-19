import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWateringDTO {
  @ApiPropertyOptional({ description: 'Date de l’arrosage' })
  @IsOptional()
  @IsDate()
  watering_date?: Date;

  @ApiPropertyOptional({ description: 'ID de la section arrosée' })
  @IsOptional()
  @IsNumber()
  id_section?: number;
}
