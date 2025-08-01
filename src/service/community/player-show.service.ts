import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerShow } from '../../entity/community/player-show.entity';
import { PlayerShowComment } from '../../entity/community/player-show-comment.entity';
import { PlayerShowLike } from '../../entity/community/player-show-like.entity';
import { PlayerShowCommentLike } from '../../entity/community/player-show-comment-like.entity';

@Provide()
export class PlayerShowService {
  @InjectEntityModel(PlayerShow)
  showRepo: Repository<PlayerShow>;

  @InjectEntityModel(PlayerShowComment)
  commentRepo: Repository<PlayerShowComment>;

  @InjectEntityModel(PlayerShowLike)
  likeRepo: Repository<PlayerShowLike>;

  @InjectEntityModel(PlayerShowCommentLike)
  commentLikeRepo: Repository<PlayerShowCommentLike>;

  // 创建玩家秀
  async createShow(data) {
    return this.showRepo.save(data);
  }

  // 获取玩家秀列表（分页）
  async getShowList(params) {
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 10;
    const [list, total] = await this.showRepo.findAndCount({
      relations: ['item', 'user'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  // 获取玩家秀详情
  async getShowDetail(id: number) {
    return this.showRepo.findOne({ 
      where: { id },
      relations: ['item', 'user']
    });
  }

  // 创建评论
  async createComment(data) {
    return this.commentRepo.save(data);
  }

  // 获取评论树（递归）
  async getComments(showId: number) {
    const all = await this.commentRepo.find({ 
      where: { show_id: showId }, 
      relations: ['user'],
      order: { created_at: 'ASC' } 
    });
    // 构建树结构
    const map = new Map();
    all.forEach(c => map.set(c.id, { ...c, children: [] }));
    const tree = [];
    for (const c of all) {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id).children.push(map.get(c.id));
      } else {
        tree.push(map.get(c.id));
      }
    }
    return tree;
  }

  // 点赞/取消点赞（去重）
  async likeShow(showId: number, userId: number) {
    const exist = await this.likeRepo.findOne({ where: { show_id: showId, user_id: userId } });
    if (exist) {
      await this.likeRepo.delete(exist.id);
      return { liked: false };
    } else {
      await this.likeRepo.save({ show_id: showId, user_id: userId });
      return { liked: true };
    }
  }

  // 评论点赞/取消（去重）
  async likeComment(commentId: number, userId: number) {
    // 验证评论是否存在
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new Error('评论不存在');
    }

    const exist = await this.commentLikeRepo.findOne({ where: { comment_id: commentId, user_id: userId } });
    if (exist) {
      // 取消点赞
      await this.commentLikeRepo.delete(exist.id);
      // 更新评论的点赞数
      await this.commentRepo.update(commentId, { 
        like_count: Math.max(0, (comment.like_count || 0) - 1) 
      });
      return { liked: false };
    } else {
      // 添加点赞
      await this.commentLikeRepo.save({ comment_id: commentId, user_id: userId });
      // 更新评论的点赞数
      await this.commentRepo.update(commentId, { 
        like_count: (comment.like_count || 0) + 1 
      });
      return { liked: true };
    }
  }
} 