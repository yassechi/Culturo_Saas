import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { GroupsService } from './groups.service';
import { AuthChard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequiertPermissions } from './decorators/permissions.decorator';
import { Permission } from './permissions/permission.enum';

class CreateGroupDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
}

class AssignGroupDto {
  @IsOptional() @IsInt() @IsPositive() @Type(() => Number) groupId: number | null;
}

@ApiTags('Groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Liste toutes les promotions/groupes' })
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthChard)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Détail d\'un groupe' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.CREER_UTILISATEUR)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Crée un groupe / promotion' })
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto.name, dto.description ?? null);
  }

  @Put(':id')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.CREER_UTILISATEUR)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Met à jour un groupe' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateGroupDto) {
    return this.groupsService.update(id, dto.name, dto.description ?? null);
  }

  @Delete(':id')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.CREER_UTILISATEUR)
  @ApiSecurity('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un groupe (désaffecte les utilisateurs)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }

  @Put('assign/:userId')
  @UseGuards(AuthChard, PermissionsGuard)
  @RequiertPermissions(Permission.CREER_UTILISATEUR)
  @ApiSecurity('bearer')
  @ApiOperation({ summary: 'Affecte un utilisateur à un groupe (null pour retirer)' })
  assignUser(@Param('userId', ParseIntPipe) userId: number, @Body() dto: AssignGroupDto) {
    return this.groupsService.assignUser(userId, dto.groupId ?? null);
  }
}
