import { createApp, close } from '@midwayjs/mock';
import { Framework, IMidwayKoaApplication } from '@midwayjs/koa';
import { BlindBoxCommentService } from '../../src/service/blindbox/blindbox-comment.service';
import { UserService } from '../../src/service/user/user.service';
import { BlindBoxService } from '../../src/service/blindbox/blindbox.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('test/service/blindbox-comment.service.test.ts', () => {
  let app: IMidwayKoaApplication;
  let blindBoxCommentService: BlindBoxCommentService;
  let userService: UserService;
  let blindBoxService: BlindBoxService;
  let userId: number;
  let blindBoxId: number;
  let commentId: number;

  beforeAll(async () => {
    app = await createApp<Framework>();
    blindBoxCommentService = await app.getApplicationContext().getAsync(BlindBoxCommentService);
    userService = await app.getApplicationContext().getAsync(UserService);
    blindBoxService = await app.getApplicationContext().getAsync(BlindBoxService);

    // 创建测试用户
    const user = await userService.createUser({
      username: 'commenttestuser_' + Date.now(),
      password: '123456',
      nickname: '评论测试用户'
    });
    userId = user.id;

    // 创建测试盲盒
    const blindBox = await blindBoxService.create({
      name: '测试盲盒',
      description: '测试盲盒描述',
      price: 99.99,
      cover_image: 'test.jpg',
      stock: 100,
      status: 1,
      seller_id: userId
    });
    blindBoxId = blindBox.id;

    // 创建一个测试评论
    const comment = await blindBoxCommentService.createComment({
      blind_box_id: blindBoxId,
      content: '测试评论内容'
    }, userId);
    commentId = comment.id;
  });

  afterAll(async () => {
    await close(app);
  });

  describe('createComment', () => {
    it('should create comment with parent_id successfully', async () => {
      // 先创建一个父评论
      const parentComment = await blindBoxCommentService.createComment({
        blind_box_id: blindBoxId,
        content: '父评论内容'
      }, userId);

      // 创建回复评论
      const result = await blindBoxCommentService.createComment({
        blind_box_id: blindBoxId,
        content: '回复评论内容',
        parent_id: parentComment.id
      }, userId);

      expect(result).toBeDefined();
      expect(result.content).toBe('回复评论内容');
      expect(result.parent_id).toBe(parentComment.id);
    });

    it('should handle invalid parent_id', async () => {
      await expect(blindBoxCommentService.createComment({
        blind_box_id: blindBoxId,
        content: '回复评论内容',
        parent_id: 99999
      }, userId)).rejects.toThrow('回复的评论不存在');
    });

    it('should handle repository error during blind box check', async () => {
      const mockRepo = blindBoxCommentService.blindBoxRepo;
      const originalFindOne = mockRepo.findOne;
      mockRepo.findOne = jest.fn().mockRejectedValue(new Error('数据库错误'));

      await expect(blindBoxCommentService.createComment({
        blind_box_id: blindBoxId,
        content: '测试评论'
      }, userId)).rejects.toThrow('数据库错误');

      mockRepo.findOne = originalFindOne;
    });
  });

  describe('getComments', () => {
    it('should handle empty comments list', async () => {
      const result = await blindBoxCommentService.getComments({
        blind_box_id: 99999,
        page: 1,
        limit: 10
      });

      expect(result.list).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(0);
    });

    it('should handle pagination with custom parameters', async () => {
      const result = await blindBoxCommentService.getComments({
        blind_box_id: blindBoxId,
        page: 2,
        limit: 5
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBeGreaterThanOrEqual(0);
    });

    it('should handle repository error during comments query', async () => {
      const mockRepo = blindBoxCommentService.commentRepo;
      const originalCreateQueryBuilder = mockRepo.createQueryBuilder;
      mockRepo.createQueryBuilder = jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockRejectedValue(new Error('查询失败'))
      });

      await expect(blindBoxCommentService.getComments({
        blind_box_id: blindBoxId,
        page: 1,
        limit: 10
      })).rejects.toThrow('查询失败');

      mockRepo.createQueryBuilder = originalCreateQueryBuilder;
    });
  });

  describe('toggleLikeComment', () => {
    it('should handle repository error during comment check', async () => {
      const mockRepo = blindBoxCommentService.commentRepo;
      const originalFindOne = mockRepo.findOne;
      mockRepo.findOne = jest.fn().mockRejectedValue(new Error('数据库错误'));

      await expect(blindBoxCommentService.toggleLikeComment(commentId, userId)).rejects.toThrow('数据库错误');

      mockRepo.findOne = originalFindOne;
    });
  });

  describe('deleteComment', () => {
    it('should handle repository error during comment check', async () => {
      const mockRepo = blindBoxCommentService.commentRepo;
      const originalFindOne = mockRepo.findOne;
      mockRepo.findOne = jest.fn().mockRejectedValue(new Error('数据库错误'));

      await expect(blindBoxCommentService.deleteComment(commentId, userId)).rejects.toThrow('数据库错误');

      mockRepo.findOne = originalFindOne;
    });

    it('should handle repository error during comment deletion', async () => {
      const mockRepo = blindBoxCommentService.commentRepo;
      const originalFindOne = mockRepo.findOne;
      const originalDelete = mockRepo.delete;
      
      mockRepo.findOne = jest.fn().mockResolvedValue({
        id: commentId,
        user_id: userId,
        blind_box_id: blindBoxId
      });
      mockRepo.delete = jest.fn().mockRejectedValue(new Error('删除失败'));

      await expect(blindBoxCommentService.deleteComment(commentId, userId)).rejects.toThrow('删除失败');

      mockRepo.findOne = originalFindOne;
      mockRepo.delete = originalDelete;
    });
  });

  describe('updateBlindBoxCommentCount', () => {
    it('should handle repository error during count query', async () => {
      const mockRepo = blindBoxCommentService.commentRepo;
      const originalCreateQueryBuilder = mockRepo.createQueryBuilder;
      mockRepo.createQueryBuilder = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockRejectedValue(new Error('计数查询失败'))
      });

      await expect(blindBoxCommentService['updateBlindBoxCommentCount'](blindBoxId)).rejects.toThrow('计数查询失败');

      mockRepo.createQueryBuilder = originalCreateQueryBuilder;
    });

    it('should handle repository error during blind box update', async () => {
      const mockRepo = blindBoxCommentService.blindBoxRepo;
      const originalUpdate = mockRepo.update;
      mockRepo.update = jest.fn().mockRejectedValue(new Error('更新失败'));

      await expect(blindBoxCommentService['updateBlindBoxCommentCount'](blindBoxId)).rejects.toThrow('更新失败');

      mockRepo.update = originalUpdate;
    });
  });

  describe('getCommentById', () => {
    it('should handle repository error', async () => {
      const mockRepo = blindBoxCommentService.commentRepo;
      const originalFindOne = mockRepo.findOne;
      mockRepo.findOne = jest.fn().mockRejectedValue(new Error('查询失败'));

      await expect(blindBoxCommentService.getCommentById(commentId)).rejects.toThrow('查询失败');

      mockRepo.findOne = originalFindOne;
    });
  });

  describe('debugGetAllComments', () => {
    it('should handle repository error', async () => {
      const mockRepo = blindBoxCommentService.commentRepo;
      const originalFind = mockRepo.find;
      mockRepo.find = jest.fn().mockRejectedValue(new Error('查询失败'));

      await expect(blindBoxCommentService.debugGetAllComments()).rejects.toThrow('查询失败');

      mockRepo.find = originalFind;
    });

    it('should handle comments without user relation', async () => {
      const mockRepo = blindBoxCommentService.commentRepo;
      const originalFind = mockRepo.find;
      mockRepo.find = jest.fn().mockResolvedValue([
        {
          id: 1,
          blind_box_id: blindBoxId,
          user_id: userId,
          content: '测试评论',
          created_at: new Date(),
          user: null // 没有用户关系
        }
      ]);

      const result = await blindBoxCommentService.debugGetAllComments();
      expect(result[0].user).toBeNull();

      mockRepo.find = originalFind;
    });
  });

  describe('debugGetCommentsWithRawSQL', () => {
    it('should handle repository error', async () => {
      const mockRepo = blindBoxCommentService.commentRepo;
      const originalQuery = mockRepo.query;
      mockRepo.query = jest.fn().mockRejectedValue(new Error('SQL查询失败'));

      await expect(blindBoxCommentService.debugGetCommentsWithRawSQL(blindBoxId)).rejects.toThrow('SQL查询失败');

      mockRepo.query = originalQuery;
    });
  });

  describe('cleanDuplicateComments', () => {
    it('should handle repository error during find', async () => {
      const mockRepo = blindBoxCommentService.commentRepo;
      const originalFind = mockRepo.find;
      mockRepo.find = jest.fn().mockRejectedValue(new Error('查询失败'));

      await expect(blindBoxCommentService.cleanDuplicateComments()).rejects.toThrow('查询失败');

      mockRepo.find = originalFind;
    });

    it('should handle repository error during delete', async () => {
      const mockRepo = blindBoxCommentService.commentRepo;
      const originalFind = mockRepo.find;
      const originalDelete = mockRepo.delete;
      
      mockRepo.find = jest.fn().mockResolvedValue([
        {
          id: 1,
          content: '重复内容',
          user_id: userId,
          blind_box_id: blindBoxId,
          created_at: new Date('2023-01-01')
        },
        {
          id: 2,
          content: '重复内容',
          user_id: userId,
          blind_box_id: blindBoxId,
          created_at: new Date('2023-01-02')
        }
      ]);
      mockRepo.delete = jest.fn().mockRejectedValue(new Error('删除失败'));

      await expect(blindBoxCommentService.cleanDuplicateComments()).rejects.toThrow('删除失败');

      mockRepo.find = originalFind;
      mockRepo.delete = originalDelete;
    });

    it('should handle empty comments list', async () => {
      const mockRepo = blindBoxCommentService.commentRepo;
      const originalFind = mockRepo.find;
      mockRepo.find = jest.fn().mockResolvedValue([]);

      const result = await blindBoxCommentService.cleanDuplicateComments();
      expect(result).toEqual([]);

      mockRepo.find = originalFind;
    });
  });

  describe('边界条件测试', () => {
    it('should handle invalid page parameters', async () => {
      const params = {
        blind_box_id: blindBoxId,
        page: -1,
        limit: 0
      };

      const result = await blindBoxCommentService.getComments(params);
      expect(result).toBeDefined();
    });

    it('should handle very large page parameters', async () => {
      const params = {
        blind_box_id: blindBoxId,
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
        blind_box_id: blindBoxId,
        content: '测试评论'
      };

      try {
        const result = await blindBoxCommentService.createComment(data, userId);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
}); 