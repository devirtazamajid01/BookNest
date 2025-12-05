import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard, Roles, RolesGuard } from '../auth';
import { MessageResponse } from '../common/entities';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackEntity } from './entities';
import { FeedbackService } from './feedback.service';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit feedback for a book' })
  @ApiResponse({ status: 201, description: 'Feedback submitted (pending approval)', type: FeedbackEntity })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({ status: 409, description: 'Feedback already exists for this book' })
  async create(@Request() req, @Body() dto: CreateFeedbackDto): Promise<FeedbackEntity> {
    return this.feedbackService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all feedback with filtering (Admin only)' })
  @ApiResponse({ status: 200, description: 'Feedback list retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async findAll(@Query() queryDto: QueryFeedbackDto) {
    return this.feedbackService.findAll(queryDto);
  }

  @Get('book/:bookId')
  @ApiOperation({ summary: 'Get approved feedback for a specific book' })
  @ApiParam({ name: 'bookId', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Book feedback retrieved' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async getBookFeedback(@Param('bookId') bookId: string, @Query() queryDto: QueryFeedbackDto) {
    return this.feedbackService.getBookFeedback(bookId, queryDto);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get feedback by a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User feedback retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserFeedback(@Param('userId') userId: string, @Query() queryDto: QueryFeedbackDto) {
    return this.feedbackService.getUserFeedback(userId, queryDto);
  }

  @Get('my-feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user feedback' })
  @ApiResponse({ status: 200, description: 'Current user feedback retrieved' })
  async getMyFeedback(@Request() req, @Query() queryDto: QueryFeedbackDto) {
    return this.feedbackService.getUserFeedback(req.user.id, queryDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get feedback by ID' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiResponse({ status: 200, description: 'Feedback retrieved', type: FeedbackEntity })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async findOne(@Param('id') id: string): Promise<FeedbackEntity> {
    return this.feedbackService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update feedback (owner or admin)' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiResponse({ status: 200, description: 'Feedback updated', type: FeedbackEntity })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateFeedbackDto, @Request() req): Promise<FeedbackEntity> {
    return this.feedbackService.update(id, dto, req.user.id, req.user.role.name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete feedback (owner or admin)' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiResponse({ status: 200, description: 'Feedback deleted', type: MessageResponse })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async remove(@Param('id') id: string, @Request() req): Promise<MessageResponse> {
    return this.feedbackService.remove(id, req.user.id, req.user.role.name);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve feedback (Admin only)' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiResponse({ status: 200, description: 'Feedback approved', type: FeedbackEntity })
  @ApiResponse({ status: 400, description: 'Already approved' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async approveFeedback(@Param('id') id: string): Promise<FeedbackEntity> {
    return this.feedbackService.approveFeedback(id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reject feedback (Admin only)' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiResponse({ status: 200, description: 'Feedback rejected', type: FeedbackEntity })
  @ApiResponse({ status: 400, description: 'Already rejected' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async rejectFeedback(@Param('id') id: string): Promise<FeedbackEntity> {
    return this.feedbackService.rejectFeedback(id);
  }
}
