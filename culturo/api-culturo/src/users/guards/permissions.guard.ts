// src/users/guards/permissions.guard.ts
import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CURRENT_USER } from 'src/utils/constants';
import { JWTPayloadType } from 'src/utils/types';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'; // Importé du décorateur
import { PERMISSIONS_PAR_ROLE } from '../permissions/role-permissions.config';
import { Permission } from '../permissions/permission.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissionsRequises = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissionsRequises) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JWTPayloadType = request[CURRENT_USER];
    
    const permissionsUtilisateur = PERMISSIONS_PAR_ROLE[user.role] || [];
    
    const aLesPermissions = permissionsRequises.every((permission) =>
      permissionsUtilisateur.includes(permission),
    );

    if (!aLesPermissions) {
      throw new ForbiddenException(
        `Permissions insuffisantes. Permissions requises : ${permissionsRequises.join(', ')}`
      );
    }

    return true;
  }
}