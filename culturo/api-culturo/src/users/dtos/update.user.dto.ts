import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
export class UpdateUserDTO {
  @IsNumber()
  @ApiProperty({ description: 'User ID' })
  id_user: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'User first name' })
  user_first_name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'User last name' })
  user_last_name?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ description: 'User birth date', type: String, format: 'date' })
  birth_day?: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({ description: 'User email' })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'User hashed password' })
  hpassword?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'User telephone' })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'User photo' })
  path_photo?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: 'User active status' })
  user_active?: boolean;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'User role ID' })
  id_role?: number;

  @IsOptional()
  @ValidateIf((o) => o.id_formateur !== null)
  @IsNumber()
  @Transform(({ value }) => (value === null ? null : value === undefined ? undefined : Number(value)))
  @ApiProperty({ description: 'Formateur ID (null to unassign)', nullable: true })
  id_formateur?: number | null;
}
