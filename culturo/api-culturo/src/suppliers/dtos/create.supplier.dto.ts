import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Graines du Marché' })
  @IsString()
  @IsNotEmpty()
  supplier_name: string;

  @ApiPropertyOptional({ example: 'contact@graines-du-marche.fr' })
  @IsOptional()
  @IsString()
  contact_email?: string;

  @ApiPropertyOptional({ example: '0612345678' })
  @IsOptional()
  @IsString()
  contact_phone?: string;

  @ApiPropertyOptional({ example: 'https://www.graines-du-marche.fr' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  supplier_active?: boolean;
}
