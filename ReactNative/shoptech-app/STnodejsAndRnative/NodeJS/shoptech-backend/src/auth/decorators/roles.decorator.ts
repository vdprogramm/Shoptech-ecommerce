import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/schemas/user.schema';

export const ROLES_KEY = 'roles';

// Decorator này cho phép truyền vào nhiều Role (VD: @Roles(Role.ADMIN, Role.STAFF))
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);