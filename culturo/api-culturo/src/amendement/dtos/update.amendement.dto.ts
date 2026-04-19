import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAmendementDTO {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID Amendement' })
  id_amendement: string;

  @IsDate()
  @IsNotEmpty()
  @ApiProperty({ description: 'Date of amendement ' })
  Date: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'Board amended' })
  id_board: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Title of amendement ' })
  titlle: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Description amendement ' })
  description: string;
}
