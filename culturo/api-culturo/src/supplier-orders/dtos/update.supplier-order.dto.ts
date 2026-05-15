import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateSupplierOrderDto {
  @ApiPropertyOptional({
    enum: ['draft', 'sent', 'received', 'cancelled'],
    example: 'sent',
  })
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'sent', 'received', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ example: '2026-05-15' })
  @IsOptional()
  @IsDateString()
  order_date?: string;

  @ApiPropertyOptional({ example: '2026-05-30' })
  @IsOptional()
  @IsDateString()
  expected_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
