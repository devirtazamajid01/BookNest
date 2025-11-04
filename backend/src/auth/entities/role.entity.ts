import { ApiProperty } from '@nestjs/swagger';

export class RoleEntity {
  @ApiProperty({ example: 'user' })
  id: string;

  @ApiProperty({ example: 'USER' })
  name: string;

  @ApiProperty({ example: 'Regular user with basic permissions', nullable: true })
  description: string | null;
}
