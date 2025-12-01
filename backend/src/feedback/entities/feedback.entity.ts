import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeedbackUserSummary {
  @ApiProperty({ example: 'user-456' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  email?: string;
}

export class FeedbackBookSummary {
  @ApiProperty({ example: 'book-789' })
  id: string;

  @ApiProperty({ example: 'The Great Gatsby' })
  title: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald' })
  author: string;
}

export class FeedbackEntity {
  @ApiProperty({ example: 'feedback-123' })
  id: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  rating: number;

  @ApiProperty({ example: 'This book was absolutely amazing!' })
  comment: string;

  @ApiProperty({ example: 'user-456' })
  userId: string;

  @ApiProperty({ example: 'book-789' })
  bookId: string;

  @ApiProperty({ example: false })
  isApproved: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: FeedbackUserSummary })
  user: FeedbackUserSummary;

  @ApiProperty({ type: FeedbackBookSummary })
  book: FeedbackBookSummary;
}
