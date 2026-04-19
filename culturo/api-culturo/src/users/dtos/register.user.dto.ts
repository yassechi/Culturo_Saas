import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class RegisterDTO {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  @ApiProperty({ description: "The user's surname" })
  user_last_name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  @ApiProperty({ description: "The user's first name" })
  user_first_name: string;

  @IsDate()
  @IsNotEmpty()
  @ApiProperty({ description: "The user's BirthDay" })
  birth_date: Date;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  @ApiProperty({ description: "The user's email address" })
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  @ApiProperty({ description: "The user's password" })
  hpassword: string;

  @IsString()
  @MaxLength(16)
  @ApiProperty({ description: "The user's telephone number" })
  phone: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'The role ID of this user' })
  id_role: number;

  @IsBoolean()
  @ApiProperty({ description: 'Active or inactive user' })
  user_active: boolean;

  @IsString()
  @ApiProperty({ description: "The path to the user's photo" })
  path_photo: string;
}
