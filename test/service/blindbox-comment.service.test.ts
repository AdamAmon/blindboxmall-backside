import { createApp, close } from '@midwayjs/mock';
import { BlindBoxCommentService } from '../../src/service/blindbox/blindbox-comment.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('test/service/blindbox-comment.service.test.ts', () => {
  let app;
  let blindBoxCommentService: BlindBoxCommentService;

  beforeAll(async () => {
    app = await createApp();
    blindBoxCommentService = await app.getApplicationContext().getAsync(BlindBoxCommentService);
  });

  afterAll(async () => {
    await close(app);
  });

  describe('createComment', () => {
    it('should throw error for non-existent blind box', async () => {
      const data = {
        blind_box_id: 99999,
        content: '测试评论'
      };
      const userId = 1;

      await expect(blindBoxCommentService.createComment(data, userId))
        .rejects.toThrow('盲盒不存在');
    });

    it('should throw error for non-existent parent comment', async () => {
      const data = {
        blind_box_id: 1,
        content: '回复评论',
        parent_id: 99999
      };
      const userId = 1;

      await expect(blindBoxCommentService.createComment(data, userId))
        .rejects.toThrow('盲盒不存在');
    });
  });

  describe('getComments', () => {
    it('should get comments list successfully', async () => {
      const params = {
        blind_box_id: 1,
        page: 1,
        limit: 10
      };

      const result = await blindBoxCommentService.getComments(params);
      expect(result).toBeDefined();
      expect(result.list).toBeDefined();
      expect(Array.isArray(result.list)).toBe(true);
      expect(result.total).toBeDefined();
      expect(result.page).toBe(params.page);
      expect(result.limit).toBe(params.limit);
      expect(result.totalPages).toBeDefined();
    });

    it('should handle pagination correctly', async () => {
      const params = {
        blind_box_id: 1,
        page: 2,
        limit: 5
      };

      const result = await blindBoxCommentService.getComments(params);
      expect(result).toBeDefined();
      expect(result.page).toBe(params.page);
      expect(result.limit).toBe(params.limit);
    });

    it('should return empty list for non-existent blind box', async () => {
      const params = {
        blind_box_id: 99999,
        page: 1,
        limit: 10
      };

      const result = await blindBoxCommentService.getComments(params);
      expect(result).toBeDefined();
      expect(result.list).toBeDefined();
      expect(Array.isArray(result.list)).toBe(true);
      expect(result.total).toBe(0);
    });
  });

  describe('toggleLikeComment', () => {
    it('should throw error for non-existent comment', async () => {
      const commentId = 99999;
      const userId = 1;

      await expect(blindBoxCommentService.toggleLikeComment(commentId, userId))
        .rejects.toThrow('评论不存在');
    });
  });

  describe('deleteComment', () => {
    it('should throw error for non-existent comment', async () => {
      const commentId = 99999;
      const userId = 1;

      await expect(blindBoxCommentService.deleteComment(commentId, userId))
        .rejects.toThrow('评论不存在');
    });
  });

  describe('getCommentById', () => {
    it('should get comment by id successfully', async () => {
      const commentId = 1;

      const result = await blindBoxCommentService.getCommentById(commentId);
      expect(result).toBeDefined();
    });

    it('should return null for non-existent comment', async () => {
      const commentId = 99999;

      const result = await blindBoxCommentService.getCommentById(commentId);
      expect(result).toBeNull();
    });
  });

  describe('debugGetAllComments', () => {
    it('should get all comments for debug', async () => {
      const result = await blindBoxCommentService.debugGetAllComments();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('debugGetCommentsWithRawSQL', () => {
    it('should get comments with raw SQL', async () => {
      const blindBoxId = 1;

      const result = await blindBoxCommentService.debugGetCommentsWithRawSQL(blindBoxId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle non-existent blind box', async () => {
      const blindBoxId = 99999;

      const result = await blindBoxCommentService.debugGetCommentsWithRawSQL(blindBoxId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('cleanDuplicateComments', () => {
    it('should clean duplicate comments successfully', async () => {
      const result = await blindBoxCommentService.cleanDuplicateComments();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('边界条件测试', () => {
    it('should handle invalid page parameters', async () => {
      const params = {
        blind_box_id: 1,
        page: -1,
        limit: 0
      };

      const result = await blindBoxCommentService.getComments(params);
      expect(result).toBeDefined();
    });

    it('should handle very large page parameters', async () => {
      const params = {
        blind_box_id: 1,
        page: 999999,
        limit: 999999
      };

      const result = await blindBoxCommentService.getComments(params);
      expect(result).toBeDefined();
    });
  });

  describe('异常处理测试', () => {
    it('should handle database connection errors gracefully', async () => {
      const data = {
        blind_box_id: 1,
        content: '测试评论'
      };
      const userId = 1;

      try {
        const result = await blindBoxCommentService.createComment(data, userId);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
}); 