import { ApiProperty } from '@nestjs/swagger';

import { RoleEntity } from './role.entity';

export class UserProfileEntity {
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
