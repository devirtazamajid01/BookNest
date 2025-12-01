import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryFeedbackDto {
  @ApiPropertyOptional({
    example: 'book-123',
    description: 'Filter feedback by book ID',
  })
  @IsOptional()
  @IsString()
  bookId?: string;

  @ApiPropertyOptional({
    example: 'user-456',
    description: 'Filter feedback by user ID',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by approval status',
  })
  @IsOptional()
  isApproved?: string | boolean;

  @ApiPropertyOptional({
    example: 4,
    description: 'Filter by minimum rating',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  minRating?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}
