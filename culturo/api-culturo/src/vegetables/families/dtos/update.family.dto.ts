import { ApiProperty } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateFamilyDTO {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'The id of Family ' })
  id_family: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of Family ' })
  family_name?: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'The Id of Family importance ' })
  id_family_importance?: number;
}
