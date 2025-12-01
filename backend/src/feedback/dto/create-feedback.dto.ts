import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  MinLength,
} from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    example: 5,
    description: 'Rating from 1 to 5 stars',
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'rating must be an integer' })
  @Min(1, { message: 'rating must be at least 1' })
  @Max(5, { message: 'rating must be at most 5' })
  @IsNotEmpty({ message: 'rating is required' })
  rating: number;

  @ApiProperty({
    example:
      'This book was absolutely amazing! The plot was engaging and the characters were well-developed.',
    description: 'User feedback comment about the book',
    minLength: 10,
  })
  @IsString({ message: 'comment must be a string' })
  @IsNotEmpty({ message: 'comment is required' })
  @MinLength(10, { message: 'comment must be at least 10 characters long' })
  comment: string;

  @ApiProperty({
    example: 'book-123',
    description: 'ID of the book this feedback is for',
  })
  @IsString({ message: 'bookId must be a string' })
  @IsNotEmpty({ message: 'bookId is required' })
  bookId: string;
}
