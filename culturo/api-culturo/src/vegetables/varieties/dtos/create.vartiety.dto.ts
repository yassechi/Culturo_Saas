// src/variety/dtos/create.vartiety.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateVarietyDTO {
  @ApiProperty({
    description: 'Nom de la variété',
    example: 'Tomate Roma',
  })
  @IsNotEmpty({ message: 'Le nom de la variété est obligatoire' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  variety_name: string;

  @ApiProperty({
    description: 'ID du légume associé',
    example: 1,
  })
  @IsNotEmpty({ message: 'L\'ID du légume est obligatoire' })
  @IsNumber({}, { message: 'L\'ID du légume doit être un nombre' })
  id_vegetable: number;
}