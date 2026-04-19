// src/variety/dtos/update.variety.dto.ts
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateVarietyDTO } from './create.vartiety.dto';

export class UpdateVarietyDTO extends PartialType(CreateVarietyDTO) {
  @ApiProperty({
    description: 'ID de la variété à mettre à jour',
    example: 1,
  })
  @IsNotEmpty({ message: 'L\'ID de la variété est obligatoire' })
  @IsNumber({}, { message: 'L\'ID doit être un nombre' })
  id_variety: number;
}