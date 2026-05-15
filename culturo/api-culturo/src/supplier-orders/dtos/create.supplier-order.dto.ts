import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSupplierOrderItemDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @IsNotEmpty()
  id_vegetable: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  id_variety?: number;

  @ApiProperty({ example: 50 })
  @IsInt()
  @IsNotEmpty()
  quantity_ordered: number;

  @ApiPropertyOptional({ example: 'plants', default: 'plants' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: '0.35' })
  @IsOptional()
  @IsString()
  unit_price?: string;
}

export class CreateSupplierOrderDto {
  @ApiProperty({ example: 1, description: 'ID du fournisseur' })
  @IsInt()
  @IsNotEmpty()
  id_supplier: number;

  @ApiProperty({ example: 1, description: 'ID de l\'utilisateur' })
  @IsInt()
  @IsNotEmpty()
  id_user: number;

  @ApiProperty({ example: '2026-05-15' })
  @IsDateString()
  @IsNotEmpty()
  order_date: string;

  @ApiPropertyOptional({ example: '2026-05-30' })
  @IsOptional()
  @IsDateString()
  expected_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateSupplierOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierOrderItemDto)
  items?: CreateSupplierOrderItemDto[];
}
