import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateVegetableDTO {
  @IsNumber()
  @ApiProperty({ description: 'The Id of vegetable' })
  id_vegetable: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The name of vegetable' })
  vegetable_name?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of variety ' })
  variety_name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The planting season' })
  planting_season?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The harvest season' })
  harvest_season?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: 'The minimum harvest duration' })
  harvest_duration_min?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: 'The maximum harvest duration' })
  harvest_duration_max?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: 'The in-row distance' })
  inrow_distance?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: 'The estimated yield' })
  estimated_yield?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: 'The ID of Family' })
  id_family?: number;
}
