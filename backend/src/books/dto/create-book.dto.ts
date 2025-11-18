import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateBookDto {
  @ApiProperty({
    example: 'The Great Gatsby',
    description: 'Book title',
  })
  @IsString({ message: 'title must be a string' })
  @MinLength(1, { message: 'title must be at least 1 character long' })
  @MaxLength(255, { message: 'title must be at most 255 characters long' })
  title: string;

  @ApiProperty({
    example: 'F. Scott Fitzgerald',
    description: 'Book author',
  })
  @IsString({ message: 'author must be a string' })
  @MinLength(1, { message: 'author must be at least 1 character long' })
  @MaxLength(255, { message: 'author must be at most 255 characters long' })
  author: string;

  @ApiProperty({
    example: '978-0-7432-7356-5',
    description: 'Book ISBN (unique identifier)',
  })
  @IsString({ message: 'isbn must be a string' })
  @MinLength(10, { message: 'isbn must be at least 10 characters long' })
  @MaxLength(20, { message: 'isbn must be at most 20 characters long' })
  isbn: string;

  @ApiProperty({
    example: 'A classic American novel set in the Jazz Age',
    description: 'Book description (optional)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(1000, {
    message: 'description must be at most 1000 characters long',
  })
  description?: string;

  @ApiProperty({
    example: '1925-04-10',
    description: 'Publication date (optional)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'publishedAt must be a valid date' })
  publishedAt?: string;
}
