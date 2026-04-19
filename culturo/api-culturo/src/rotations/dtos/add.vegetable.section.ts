// src/dto/add-vegetable-to-board.dto.ts

import { 
  IsNumber, 
  IsDateString, 
  IsOptional, 
  IsString, 
  IsNotEmpty, 
  IsPositive, 
  IsBoolean,
  IsNumberString 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddVegetableToBoardDto {
  @ApiProperty({ description: 'ID de la planche de culture cible.', example: 1 })
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  boardId: number;

  @ApiProperty({ description: 'Numéro de la section dans la planche (ex: 1 à 4).', example: 2 })
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  sectionNumber: number;

  @ApiProperty({ description: 'ID du légume à planter (ex: 1 pour Tomate).', example: 5 })
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  vegetableId: number;

  @ApiProperty({ description: 'Date de début de la plantation (format YYYY-MM-DD).', example: '2025-05-15' })
  @IsNotEmpty()
  @IsDateString()
  startDate: Date;

  @ApiProperty({ description: 'Date de fin de cycle (estimation basée sur la durée de récolte du légume).', example: '2025-09-30' })
  @IsNotEmpty()
  @IsDateString()
  endDate: Date;

  @ApiProperty({ description: 'Quantité plantée (optionnelle).', example: 10, required: false })
  @IsOptional()
  @IsNumber()
  quantityPlanted: number = 0;

  @ApiProperty({ description: "Unité de mesure de la quantité (ex: 'unité', 'm2', 'pieds').", example: 'pieds' })
  @IsNotEmpty()
  @IsString()
  unity: string;

  @ApiProperty({ 
    description: "Identifiant de la variété. Peut être l'ID (nombre) ou le nom (chaîne de caractères).", 
    example: 'Roma' 
  })
  @IsNotEmpty()
  // Note: On utilise IsString ou IsNumber, la validation sera gérée par le service.
  varietyIdentifier: string | number;

  @ApiProperty({ 
    description: 'Permet de passer outre les avertissements de rotation des cultures (défaut: false).', 
    example: true, 
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  bypass?: boolean = false; 
}