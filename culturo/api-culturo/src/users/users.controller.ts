// src/users/users.controller.ts
import { CurrentUser } from './decorators/current-user.decorator';
import { RequiertPermissions } from './decorators/permissions.decorator';

import { PermissionsGuard } from './guards/permissions.guard';
import { UpdateUserDTO } from './dtos/update.user.dto';
import { RegisterDTO } from './dtos/register.user.dto';
import type { JWTPayloadType } from 'src/utils/types';
import { User_ } from 'src/entities/user_.entity';
import { AuthChard } from './guards/auth.guard';
import { UsersService } from './users.service';
import { LoginDTO } from './dtos/login.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { Permission } from './permissions/permission.enum';

@ApiTags('User Group')
@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  /**
   * Récupérer tous les utilisateurs - Uniquement FORMATEUR
   */
  @Get()
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.ACCEDER_LISTE_UTILISATEURS)
  @ApiSecurity('bearer')
  @ApiResponse({ status: 200, description: 'Users fetched successfully' })
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  /**
   * Récupérer les utilisateurs actifs - Uniquement FORMATEUR
   */
  @Get('active')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.ACCEDER_LISTE_UTILISATEURS)
  @ApiSecurity('bearer')
  @ApiResponse({
    status: 200,
    description: 'Users Active fetched successfully',
  })
  @ApiOperation({ summary: 'Get all Active users' })
  async getActiveUsers() {
    return await this.userService.getActiveUsers();
  }

  /**
   * Récupérer les utilisateurs inactifs - Uniquement FORMATEUR
   */
  @Get('inactive')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.ACCEDER_LISTE_UTILISATEURS)
  @ApiSecurity('bearer')
  @ApiResponse({
    status: 200,
    description: 'Users Inactive fetched successfully',
  })
  @ApiOperation({ summary: 'Get all Inactive users' })
  async getInactivatedUsers() {
    return await this.userService.getInactivatedUsers();
  }

  /**
   * Récupérer un utilisateur par ID - Authentifié uniquement
   */
  @Get('/:id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Get User by Id' })
  async getOneUser(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getUserById(id);
  }

  /**
   * Mettre à jour un utilisateur - Uniquement FORMATEUR
   */
  @Put()
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.MODIFIER_UTILISATEUR_STAGIAIRE)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Update User' })
  async updateUser(@Body() updateUserDto: UpdateUserDTO) {
    return await this.userService.updateUser(updateUserDto);
  }

  /**
   * Changer le statut d'un utilisateur - Uniquement FORMATEUR
   */
  @Patch('status/:id/:status')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.SUPPRIMER_UTILISATEUR)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Disactivate User' })
  async setUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('status') status: string,
  ) {
    return this.userService.setUserActiveStatus(id, status);
  }

  /**
   * Créer un nouvel utilisateur - Uniquement FORMATEUR
   */
  @Post('register')
  // @UseGuards(AuthChard, PermissionsGuard)
  // @RequiertPermissions(Permission.CREER_UTILISATEUR)
  // @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Register User' })
  public async registerUser(@Body() registerDto: RegisterDTO) {
    return await this.userService.register(registerDto);
  }

  /**
   * Connexion - Accessible à tous (pas de guard)
   */
  @Post('login')
  @ApiOperation({ summary: 'Login User' })
  @HttpCode(HttpStatus.OK)
  public async login(@Body() loginDto: LoginDTO) {
    return this.userService.login(loginDto);
  }

  /**
   * Récupérer l'utilisateur connecté - Authentifié uniquement
   */
  @ApiSecurity('bearer')
  @Post('current')
  @UseGuards(AuthChard)
  @ApiOperation({ summary: 'Get Current User (from token)' })
  public async getCurrentUser(
    @CurrentUser() payload: JWTPayloadType,
  ): Promise<User_> {
    return this.userService.getCurrentUser(payload.id);
  }
}