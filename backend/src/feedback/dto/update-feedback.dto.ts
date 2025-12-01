import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  MinLength,
} from 'class-validator';

export class UpdateFeedbackDto {
  @ApiPropertyOptional({
    example: 4,
    description: 'Updated rating from 1 to 5 stars',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt({ message: 'rating must be an integer' })
  @Min(1, { message: 'rating must be at least 1' })
  @Max(5, { message: 'rating must be at most 5' })
  rating?: number;

  @ApiPropertyOptional({
    example:
      'Updated comment: After re-reading, I think this book deserves a 4-star rating.',
    description: 'Updated feedback comment about the book',
    minLength: 10,
  })
  @IsOptional()
  @IsString({ message: 'comment must be a string' })
  @MinLength(10, { message: 'comment must be at least 10 characters long' })
  comment?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Admin approval status (admin only)',
  })
  @IsOptional()
  isApproved?: boolean;
}
