import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Headers,
  Ip,
  ValidationPipe,
} from '@nestjs/common';
import { AnalyticsService, CreateViewHistoryDto } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('view')
  async recordView(
    @Body(ValidationPipe) data: CreateViewHistoryDto,
    @Headers('x-session-id') sessionId?: string,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
  ) {
    const viewData = {
      ...data,
      sessionId: sessionId || data.sessionId,
      userAgent,
      ipAddress,
    };

    const result = await this.analyticsService.recordView(viewData);
    
    return {
      success: true,
      data: result,
    };
  }

  @Get('history')
  async getViewHistory(
    @Headers('x-session-id') sessionId?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('itemType') itemType?: 'product' | 'category' | 'search',
  ) {
    const options = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      itemType,
    };

    const result = await this.analyticsService.getViewHistory(
      sessionId,
      userId,
      options,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Get('popular')
  async getPopularItems(
    @Query('itemType') itemType: 'product' | 'category' | 'search' = 'product',
    @Query('limit') limit?: string,
    @Query('timeframe') timeframe?: 'day' | 'week' | 'month',
  ) {
    const options = {
      limit: limit ? parseInt(limit) : undefined,
      timeframe,
    };

    const result = await this.analyticsService.getPopularItems(itemType, options);

    return {
      success: true,
      data: result,
    };
  }

  @Get('recommendations')
  async getUserRecommendations(
    @Headers('x-session-id') sessionId?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
  ) {
    const options = {
      limit: limit ? parseInt(limit) : undefined,
    };

    const result = await this.analyticsService.getUserRecommendations(
      sessionId,
      userId,
      options,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  async getViewStats(
    @Query('timeframe') timeframe?: 'day' | 'week' | 'month',
  ) {
    const result = await this.analyticsService.getViewStats({ timeframe });

    return {
      success: true,
      data: result,
    };
  }

  @Delete('history')
  async clearViewHistory(
    @Headers('x-session-id') sessionId?: string,
    @Query('userId') userId?: string,
  ) {
    await this.analyticsService.clearViewHistory(sessionId, userId);

    return {
      success: true,
      message: 'View history cleared successfully',
    };
  }
}