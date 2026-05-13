import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDTO {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
