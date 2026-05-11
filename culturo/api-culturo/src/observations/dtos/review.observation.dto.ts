import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewObservationDTO {
  @ApiProperty({
    description: 'Décision du formateur',
    enum: ['approved', 'changes_requested'],
    example: 'approved',
  })
  @IsString()
  @IsIn(['approved', 'changes_requested'])
  reviewStatus: 'approved' | 'changes_requested';

  @ApiPropertyOptional({
    description: 'Retour du formateur',
    example: 'Observation claire, merci pour le niveau de détail.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNotes?: string;
}
