import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookEntity {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ example: 'The Great Gatsby' })
  title: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald' })
  author: string;

  @ApiProperty({ example: '978-0-7432-7356-5' })
  isbn: string;

  @ApiPropertyOptional({ example: 'A classic American novel', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ example: '1925-04-10T00:00:00.000Z', nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class FeedbackSummary {
  @ApiProperty({ example: 'feedback-123' })
  id: string;

  @ApiProperty({ example: 5 })
  rating: number;
}

export class BookWithFeedbackEntity extends BookEntity {
  @ApiProperty({ type: [FeedbackSummary] })
  feedbacks: FeedbackSummary[];
}
