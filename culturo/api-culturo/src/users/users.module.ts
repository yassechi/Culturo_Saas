// src/users/users.module.ts
import { UsersController } from './users.controller';
import { User_ } from 'src/entities/user_.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { UsersService } from './users.service';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { UserGroup } from 'src/entities/user_group.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from 'src/email/email.module';
import { AuthChard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User_, Role, UserGroup]),
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          global: true,
          secret: config.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: '1d',
          },
        };
      },
    }),
    EmailModule,
  ],
  providers: [UsersService, GroupsService, AuthChard, PermissionsGuard],
  controllers: [UsersController, GroupsController],
  exports: [UsersService, GroupsService, AuthChard, PermissionsGuard, JwtModule],
})
export class UsersModule {}