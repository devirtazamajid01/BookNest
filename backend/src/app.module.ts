import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { FeedbackModule } from './feedback/feedback.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, BooksModule, FeedbackModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
