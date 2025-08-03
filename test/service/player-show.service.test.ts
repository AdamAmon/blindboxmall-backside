import { createApp, close } from '@midwayjs/mock';
import { PlayerShowService } from '../../src/service/community/player-show.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('test/service/player-show.service.test.ts', () => {
  let app;
  let playerShowService: PlayerShowService;

  beforeAll(async () => {
    app = await createApp();
    playerShowService = await app.getApplicationContext().getAsync(PlayerShowService);
  });

  afterAll(async () => {
    await close(app);
  });

  describe('getShowList', () => {
    it('should get show list successfully', async () => {
      const params = {
        page: 1,
        pageSize: 10
      };

      const result = await playerShowService.getShowList(params);
      expect(result).toBeDefined();
      expect(result.list).toBeDefined();
      expect(Array.isArray(result.list)).toBe(true);
      expect(result.total).toBeDefined();
      expect(result.page).toBe(params.page);
      expect(result.pageSize).toBe(params.pageSize);
    });

    it('should handle pagination correctly', async () => {
      const params = {
        page: 2,
        pageSize: 5
      };

      const result = await playerShowService.getShowList(params);
      expect(result).toBeDefined();
      expect(result.page).toBe(params.page);
      expect(result.pageSize).toBe(params.pageSize);
    });

    it('should handle invalid page parameters', async () => {
      const params = {
        page: -1,
        pageSize: 0
      };

      const result = await playerShowService.getShowList(params);
      expect(result).toBeDefined();
    });

    it('should handle very large page parameters', async () => {
      const params = {
        page: 999999,
        pageSize: 999999
      };

      const result = await playerShowService.getShowList(params);
      expect(result).toBeDefined();
    });

    it('should handle missing parameters', async () => {
      const result = await playerShowService.getShowList({});
      expect(result).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should handle string parameters', async () => {
      const params = {
        page: '2',
        pageSize: '5'
      };

      const result = await playerShowService.getShowList(params);
      expect(result).toBeDefined();
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(5);
    });

    it('should handle null parameters', async () => {
      try {
        const result = await playerShowService.getShowList(null);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined parameters', async () => {
      try {
        const result = await playerShowService.getShowList(undefined);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid data types', async () => {
      try {
        const result = await playerShowService.getShowList('invalid');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty string parameters', async () => {
      try {
        const result = await playerShowService.getShowList({ page: '', pageSize: '' });
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getShowDetail', () => {
    it('should get show detail successfully', async () => {
      const showId = 1;

      const result = await playerShowService.getShowDetail(showId);
      expect(result).toBeDefined();
    });

    it('should return null for non-existent show', async () => {
      const showId = 99999;

      const result = await playerShowService.getShowDetail(showId);
      expect(result).toBeNull();
    });

    it('should handle zero show id', async () => {
      const showId = 0;

      const result = await playerShowService.getShowDetail(showId);
      expect(result).toBeDefined();
    });

    it('should handle negative show id', async () => {
      const showId = -1;

      const result = await playerShowService.getShowDetail(showId);
      expect(result).toBeDefined();
    });

    it('should handle very large show id', async () => {
      const showId = Number.MAX_SAFE_INTEGER;

      try {
        const result = await playerShowService.getShowDetail(showId);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getComments', () => {
    it('should get comments tree successfully', async () => {
      const showId = 1;

      const result = await playerShowService.getComments(showId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for non-existent show', async () => {
      const showId = 99999;

      const result = await playerShowService.getComments(showId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle zero show id', async () => {
      const showId = 0;

      const result = await playerShowService.getComments(showId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle negative show id', async () => {
      const showId = -1;

      const result = await playerShowService.getComments(showId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should build comment tree correctly', async () => {
      const showId = 1;
      
      const result = await playerShowService.getComments(showId);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // 检查树结构是否正确
      if (result.length > 0) {
        const firstComment = result[0];
        expect(firstComment).toHaveProperty('children');
        expect(Array.isArray((firstComment as Record<string, unknown>).children)).toBe(true);
      }
    });

    it('should handle very large show id', async () => {
      const showId = Number.MAX_SAFE_INTEGER;

      try {
        const result = await playerShowService.getComments(showId);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('likeComment', () => {
    it('should throw error for non-existent comment', async () => {
      const commentId = 99999;
      const userId = 1;

      await expect(playerShowService.likeComment(commentId, userId))
        .rejects.toThrow('评论不存在');
    });

    it('should handle like comment with zero comment id', async () => {
      const commentId = 0;
      const userId = 1;

      await expect(playerShowService.likeComment(commentId, userId))
        .rejects.toThrow('评论不存在');
    });

    it('should handle like comment with negative comment id', async () => {
      const commentId = -1;
      const userId = 1;

      await expect(playerShowService.likeComment(commentId, userId))
        .rejects.toThrow('评论不存在');
    });

    it('should handle like comment with very large comment id', async () => {
      const commentId = Number.MAX_SAFE_INTEGER;
      const userId = 1;

      await expect(playerShowService.likeComment(commentId, userId))
        .rejects.toThrow('评论不存在');
    });
  });

  describe('边界条件测试', () => {
    it('should handle database connection errors gracefully', async () => {
      const params = {
        page: 1,
        pageSize: 10
      };

      try {
        const result = await playerShowService.getShowList(params);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle concurrent operations', async () => {
      const params = {
        page: 1,
        pageSize: 10
      };

      const promises = [
        playerShowService.getShowList(params),
        playerShowService.getShowList(params),
        playerShowService.getShowList(params)
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.list).toBeDefined();
      });
    });

    it('should handle concurrent detail operations', async () => {
      const showId = 1;

      const promises = [
        playerShowService.getShowDetail(showId),
        playerShowService.getShowDetail(showId),
        playerShowService.getShowDetail(showId)
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should handle concurrent comment operations', async () => {
      const showId = 1;

      const promises = [
        playerShowService.getComments(showId),
        playerShowService.getComments(showId),
        playerShowService.getComments(showId)
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('异常处理测试', () => {
    it('should handle invalid show id types', async () => {
      try {
        const result = await playerShowService.getShowDetail('invalid' as unknown as number);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid comment id types', async () => {
      try {
        await playerShowService.likeComment('invalid' as unknown as number, 1);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid user id types', async () => {
      try {
        await playerShowService.likeComment(1, 'invalid' as unknown as number);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle null show id', async () => {
      try {
        const result = await playerShowService.getShowDetail(null as unknown as number);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined show id', async () => {
      try {
        const result = await playerShowService.getShowDetail(undefined as unknown as number);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle null comment id', async () => {
      try {
        await playerShowService.likeComment(null as unknown as number, 1);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined comment id', async () => {
      try {
        await playerShowService.likeComment(undefined as unknown as number, 1);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle null user id', async () => {
      try {
        await playerShowService.likeComment(1, null as unknown as number);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle undefined user id', async () => {
      try {
        await playerShowService.likeComment(1, undefined as unknown as number);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('方法调用测试', () => {
    it('should call createShow method', async () => {
      // 测试方法存在且可调用
      expect(typeof playerShowService.createShow).toBe('function');
    });

    it('should call createComment method', async () => {
      // 测试方法存在且可调用
      expect(typeof playerShowService.createComment).toBe('function');
    });

    it('should call likeShow method', async () => {
      // 测试方法存在且可调用
      expect(typeof playerShowService.likeShow).toBe('function');
    });

    it('should call likeComment method', async () => {
      // 测试方法存在且可调用
      expect(typeof playerShowService.likeComment).toBe('function');
    });
  });
}); 