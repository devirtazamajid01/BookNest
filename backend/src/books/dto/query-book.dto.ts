import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryBookDto {
  @ApiProperty({
    example: 'Gatsby',
    description: 'Search term for book title',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'title must be a string' })
  title?: string;

  @ApiProperty({
    example: 'Fitzgerald',
    description: 'Search term for book author',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'author must be a string' })
  author?: string;

  @ApiProperty({
    example: '978-0-7432-7356-5',
    description: 'Search by ISBN',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'isbn must be a string' })
  isbn?: string;

  @ApiProperty({
    example: 1,
    description: 'Page number (starts from 1)',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must be at most 100' })
  limit?: number = 10;
}
