import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWateringDTO {
  @ApiProperty({ description: 'Date de l’arrosage' })
  @IsDate()
  @IsNotEmpty()
  watering_date: Date;

  @ApiProperty({ description: 'ID de la section arrosée' })
  @IsNumber()
  @IsNotEmpty()
  id_section: number;
}
