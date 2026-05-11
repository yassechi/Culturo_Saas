import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

function toBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return undefined;
}

export class ListObservationsQueryDTO {
  @ApiPropertyOptional({ description: 'Limiter aux observations du user connecté' })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  mine?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrer par statut de revue',
    enum: ['pending', 'approved', 'changes_requested'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'changes_requested'])
  reviewStatus?: 'pending' | 'approved' | 'changes_requested';

  @ApiPropertyOptional({ description: 'Filtrer par section' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sectionId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par planche' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  boardId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par sole' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  soleId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par auteur' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  authorId?: number;

  @ApiPropertyOptional({ description: 'Recherche texte libre' })
  @IsOptional()
  @IsString()
  search?: string;
}
