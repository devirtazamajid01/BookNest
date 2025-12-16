import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ChangeRoleDto {
  @ApiProperty({
    example: 'admin',
    description: 'New role ID for the user',
    enum: ['user', 'admin'],
  })
  @IsString({ message: 'roleId must be a string' })
  @IsNotEmpty({ message: 'roleId is required' })
  roleId: string;
}
