// src/users/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions/permission.enum';


export const PERMISSIONS_KEY = 'permissions';

export function RequiertPermissions(...permissions: Permission[]) {
  return SetMetadata(PERMISSIONS_KEY, permissions);
}