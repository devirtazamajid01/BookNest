import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUserDto {
  @ApiProperty({
    example: 'john',
    description: 'Search users by name',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  name?: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Search users by email',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'email must be a string' })
  email?: string;

  @ApiProperty({
    example: 'USER',
    description: 'Filter users by role name',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'role must be a string' })
  role?: string;

  @ApiProperty({
    example: 1,
    description: 'Page number for pagination',
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Number of users per page',
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  limit?: number = 10;
}
