import { ApiProperty } from '@nestjs/swagger';

import { RoleEntity } from '../../auth/entities';

export class UserEntity {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'user' })
  roleId: string;

  @ApiProperty({ type: RoleEntity })
  role: RoleEntity;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class UserStatsEntity {
  @ApiProperty({ example: 10 })
  totalUsers: number;

  @ApiProperty({ example: 8 })
  userRoleCount: number;

  @ApiProperty({ example: 2 })
  adminRoleCount: number;
}
