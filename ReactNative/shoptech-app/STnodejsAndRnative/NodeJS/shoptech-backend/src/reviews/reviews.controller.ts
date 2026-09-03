import { Controller, Post, Body, Get, Param, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  addReview(@Request() req, @Body() body: { productId: string, rating: number, comment: string }) {
    return this.reviewsService.addReview(req.user.userId, body.productId, body.rating, body.comment);
  }

  @Get('product/:productId')
  getReviews(@Param('productId') productId: string) {
    return this.reviewsService.getReviewsByProduct(productId);
  }

  @Get('product/:productId/count')
  async getReviewCount(@Param('productId') productId: string) {
    const count = await this.reviewsService.getReviewCount(productId);
    return { count };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':reviewId')
  async update(
    @Request() req,
    @Param('reviewId') reviewId: string,
    @Body() body: { rating: number, comment: string }
  ) {
    return this.reviewsService.updateReview(reviewId, req.user.userId, body.rating, body.comment);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':reviewId')
  async delete(@Request() req, @Param('reviewId') reviewId: string) {
    return this.reviewsService.deleteReview(reviewId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard) // Thêm Guard phân quyền admin nếu có
  @Get()
  async getAllReviewsForAdmin() {
    return this.reviewsService.getAllReviewsForAdmin();
  }
}