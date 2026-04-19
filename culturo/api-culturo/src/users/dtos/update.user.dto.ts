import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
} from 'class-validator';
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
  @IsDate()
  @ApiProperty({ description: 'User birth date' })
  birth_day?: Date;

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
}
