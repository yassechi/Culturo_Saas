import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class LoginDTO {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150) ////
  @ApiProperty({ description: "the user's email address" })
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  @ApiProperty({ description: "the user's password" })
  hpassword: string;
}
