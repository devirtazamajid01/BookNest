import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  email?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @MinLength(2, { message: 'name must be at least 2 characters long' })
  name?: string;

  @ApiProperty({
    example: 'newpassword123',
    description: 'User password (optional)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'password must be a string' })
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  password?: string;
}
