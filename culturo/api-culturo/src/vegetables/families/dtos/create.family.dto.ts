import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFamilyDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of Family ' })
  family_name: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'The ID of Family_importance ' })
  id_family_importance: number;
}
