import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDTO {
  @ApiProperty({ description: 'Token reçu par email' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Nouveau mot de passe (min 6 caractères)' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
