import { Controller, Post, Get, Body, Query, Inject } from '@midwayjs/core';
import { PlayerShowService } from '../../service/community/player-show.service';

@Controller('/api/community/show')
export class PlayerShowController {
  @Inject()
  showService: PlayerShowService;

  @Post('/create')
  async createShow(@Body() body) {
    try {
      const data = await this.showService.createShow(body);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('/list')
  async getShowList(@Query() query) {
    try {
      const data = await this.showService.getShowList(query);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('/detail')
  async getShowDetail(@Query('id') id: number) {
    try {
      if (!id) return { success: false, message: '缺少id参数' };
      const data = await this.showService.getShowDetail(id);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('/comment')
  async createComment(@Body() body) {
    try {
      const data = await this.showService.createComment(body);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('/comments')
  async getComments(@Query('show_id') showId: number) {
    try {
      if (!showId) return { success: false, message: '缺少show_id参数' };
      const data = await this.showService.getComments(showId);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('/like')
  async likeShow(@Body('show_id') showId: number, @Body('user_id') userId: number) {
    try {
      if (!showId || !userId) return { success: false, message: '缺少参数' };
      const data = await this.showService.likeShow(showId, userId);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('/comment/like')
  async likeComment(@Body('comment_id') commentId: number, @Body('user_id') userId: number) {
    try {
      if (!commentId || !userId) return { success: false, message: '缺少参数' };
      const data = await this.showService.likeComment(commentId, userId);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
} 