import { IsString, IsNumber, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Importez le décorateur Swagger

// Vous n'avez pas besoin de décorateurs Swagger sur l'interface interne
export interface RawCulturePlanResult {
  board_board_name: string;
  board_id_board: number;
  vegetable_vegetable_name: string;
  vegetable_variety_name: string;
  section_start_date: Date;
  section_end_date: Date;
}

export class BoardPlanDto {
  @ApiProperty({ description: "Nom de la planche/bande (ex: 'A01').", example: 'A01' })
  @IsString()
  boardName: string;

  @ApiProperty({ description: 'ID de la planche.', example: 1 })
  @IsNumber()
  boardId: number;

  @ApiProperty({ description: "Nom du légume planté (ex: 'Tomate').", example: 'Tomate' })
  @IsString()
  vegetableName: string;

  @ApiProperty({ description: "Variété du légume.", example: 'Marmande', nullable: true })
  @IsString()
  varietyName: string | null;

  @ApiProperty({ description: "Famille botanique du légume.", example: 'Solanacées', nullable: true })
  @IsString()
  familyName: string | null;

  @ApiProperty({ description: "Type d'importance de la famille (primaire, secondaire…).", example: 'primaire', nullable: true })
  @IsString()
  familyType: string | null;

  @ApiProperty({ description: "Quantité plantée.", example: 85 })
  @IsNumber()
  quantityPlanted: number;

  @ApiProperty({ description: 'Date de début.', type: String, format: 'date-time', example: '2025-03-15T00:00:00.000Z' })
  @IsDate()
  startDate: Date;

  @ApiProperty({ description: 'Date de fin estimée.', type: String, format: 'date-time', example: '2025-07-30T00:00:00.000Z' })
  @IsDate()
  endDate: Date;
}
