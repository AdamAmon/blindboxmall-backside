import { Controller, Get, Post, Del, Body, Query, Param, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { BlindBoxCommentService } from '../../service/blindbox/blindbox-comment.service';
import {
  CreateBlindBoxCommentDTO,
  QueryBlindBoxCommentDTO,
  LikeBlindBoxCommentDTO,
} from '../../dto/blindbox/blindbox-comment.dto';

/**
 * 盲盒评论控制器
 */
@Controller('/api/blindbox/comment')
export class BlindBoxCommentController {
  @Inject()
  blindBoxCommentService: BlindBoxCommentService;

  /**
   * 创建评论
   * @POST /api/blindbox/comment
   */
  @Post('/')
  async create(ctx: Context, @Body() createDto: CreateBlindBoxCommentDTO) {
    try {
      const userId = ctx.user?.id;
      if (!userId) {
        ctx.status = 401;
        return {
          code: 401,
          success: false,
          message: '用户未登录',
          data: null
        };
      }

      const result = await this.blindBoxCommentService.createComment(createDto, userId);
      return {
        code: 200,
        success: true,
        message: '评论发布成功',
        data: result,
      };
    } catch (error) {
      ctx.status = 400;
      return {
        code: 400,
        success: false,
        message: error.message || '评论发布失败',
        data: null
      };
    }
  }

  /**
   * 获取评论列表
   * @GET /api/blindbox/comment/list
   */
  @Get('/list')
  async getComments(@Query() queryDto: QueryBlindBoxCommentDTO) {
    try {
      const result = await this.blindBoxCommentService.getComments(queryDto);
      return {
        code: 200,
        success: true,
        message: '获取评论成功',
        data: result,
      };
    } catch (error) {
      return {
        code: 500,
        success: false,
        message: error.message || '获取评论失败',
        data: null
      };
    }
  }

  /**
   * 点赞/取消点赞评论
   * @POST /api/blindbox/comment/like
   */
  @Post('/like')
  async likeComment(ctx: Context, @Body() likeDto: LikeBlindBoxCommentDTO) {
    try {
      const userId = ctx.user?.id;
      if (!userId) {
        ctx.status = 401;
        return {
          code: 401,
          success: false,
          message: '用户未登录',
          data: null
        };
      }

      const result = await this.blindBoxCommentService.toggleLikeComment(likeDto.comment_id, userId);
      return {
        code: 200,
        success: true,
        message: result.liked ? '点赞成功' : '取消点赞成功',
        data: result,
      };
    } catch (error) {
      ctx.status = 400;
      return {
        code: 400,
        success: false,
        message: error.message || '操作失败',
        data: null
      };
    }
  }

  /**
   * 删除评论
   * @DELETE /api/blindbox/comment/:id
   */
  @Del('/:id')
  async deleteComment(ctx: Context, @Param('id') id: number) {
    try {
      const userId = ctx.user?.id;
      if (!userId) {
        ctx.status = 401;
        return {
          code: 401,
          success: false,
          message: '用户未登录',
          data: null
        };
      }

      await this.blindBoxCommentService.deleteComment(id, userId);
      return {
        code: 200,
        success: true,
        message: '评论删除成功',
        data: true,
      };
    } catch (error) {
      ctx.status = 400;
      return {
        code: 400,
        success: false,
        message: error.message || '评论删除失败',
        data: null
      };
    }
  }

  /**
   * 获取评论详情
   * @GET /api/blindbox/comment/:id
   */
  @Get('/:id')
  async getCommentById(@Param('id') id: number) {
    try {
      const result = await this.blindBoxCommentService.getCommentById(id);
      if (!result) {
        return {
          code: 404,
          success: false,
          message: '评论不存在',
          data: null
        };
      }
      return {
        code: 200,
        success: true,
        message: '获取评论详情成功',
        data: result,
      };
    } catch (error) {
      return {
        code: 500,
        success: false,
        message: error.message || '获取评论详情失败',
        data: null
      };
    }
  }

  /**
   * 调试接口：获取所有评论数据
   * @GET /api/blindbox/comment/debug/all
   */
  @Get('/debug/all')
  async debugAllComments() {
    try {
      const comments = await this.blindBoxCommentService.debugGetAllComments();
      return {
        code: 200,
        success: true,
        message: '调试数据获取成功',
        data: comments,
      };
    } catch (error) {
      return {
        code: 500,
        success: false,
        message: error.message || '获取失败',
        data: null
      };
    }
  }

  /**
   * 清理重复评论数据
   * @GET /api/blindbox/comment/debug/clean
   */
  @Get('/debug/clean')
  async cleanDuplicateComments() {
    try {
      const deletedIds = await this.blindBoxCommentService.cleanDuplicateComments();
      return {
        code: 200,
        success: true,
        message: `清理完成，删除了 ${deletedIds.length} 条重复评论`,
        data: deletedIds,
      };
    } catch (error) {
      return {
        code: 500,
        success: false,
        message: error.message || '清理失败',
        data: null
      };
    }
  }

  /**
   * 调试接口：使用原生SQL查询评论
   * @GET /api/blindbox/comment/debug/raw/:blindBoxId
   */
  @Get('/debug/raw/:blindBoxId')
  async debugGetCommentsWithRawSQL(@Param('blindBoxId') blindBoxId: string) {
    try {
      const comments = await this.blindBoxCommentService.debugGetCommentsWithRawSQL(parseInt(blindBoxId));
      return {
        code: 200,
        success: true,
        message: '原生SQL查询成功',
        data: comments,
      };
    } catch (error) {
      return {
        code: 500,
        success: false,
        message: error.message || '查询失败',
        data: null
      };
    }
  }
} 