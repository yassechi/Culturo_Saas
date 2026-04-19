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
  @ApiProperty({
    description: "Nom de la planche/bande (ex: 'A01').",
    example: 'A01',
  })
  @IsString()
  boardName: string;

  @ApiProperty({
    description: 'ID de la planche.',
    example: 1,
  })
  @IsNumber()
  boardId: number;

  @ApiProperty({
    description: "Nom du légume planté (ex: 'Tomate').",
    example: 'Tomate',
  })
  @IsString()
  vegetableName: string;

  // @ApiProperty({
  //   description: "Variété du légume (ex: 'Marmande').",
  //   example: 'Marmande',
  // })
  // @IsString()
  // varietyName: string | null;

  @ApiProperty({
    description: 'Date de début de la culture/plantation.',
    type: String, // Définir comme String pour le format Date ISO en JSON
    format: 'date-time',
    example: '2025-03-15T00:00:00.000Z',
  })
  @IsDate()
  startDate: Date;

  @ApiProperty({
    description: 'Date de fin estimée de la culture/récolte.',
    type: String, // Définir comme String pour le format Date ISO en JSON
    format: 'date-time',
    example: '2025-07-30T00:00:00.000Z',
  })
  @IsDate()
  endDate: Date;

  constructor(
    boardName: string,
    boardId: number,
    vegetableName: string,
    varietyName: string,
    startDate: Date,
    endDate: Date,
  ) {
    this.boardName = boardName;
    this.boardId = boardId;
    this.vegetableName = vegetableName;
    // this.varietyName = varietyName;
    this.startDate = startDate;
    this.endDate = endDate;
  }
}
