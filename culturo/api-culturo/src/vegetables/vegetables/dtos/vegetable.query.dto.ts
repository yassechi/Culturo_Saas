import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({ description: 'Search by vegetable name' })
  @IsString()
  @IsNotEmpty()
  searchName: string;
}
