import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCatalogueDTO {
  @ApiProperty({ description: 'Nom du produit', example: 'Compost maison' })
  @IsString()
  @IsNotEmpty()
  amendment_name: string;

  @ApiProperty({
    description: 'Notice d\'utilisation / composition du produit',
    example: 'Amendement organique riche en azote. Apporter 2 kg/m² en surface avant binage.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notice?: string;
}

export class UpdateCatalogueDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  amendment_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notice?: string;
}
