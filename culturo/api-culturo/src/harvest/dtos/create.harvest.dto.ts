// dtos/create.harvest.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateHarvestDTO {
  @ApiProperty({
    description: "Date de la récolte (format 'AAAA-MM-JJ')",
    example: '2025-10-20',
  })
  @IsNotEmpty()
  @IsDateString()
  harvest_date: Date;

  @ApiProperty({ description: 'Quantité récoltée', example: 50 })
  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @ApiProperty({ description: "Unité de quantité (ex: 'kg', 'pièces')", example: 'kg' })
  @IsNotEmpty()
  @IsString()
  quantity_unit: string;

  @ApiProperty({ description: "ID de l'utilisateur qui a effectué la récolte", example: 1 })
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @ApiProperty({ description: "ID de la section concernée par la récolte", example: 4 })
  @IsNotEmpty()
  @IsInt()
  id_section: number;
}