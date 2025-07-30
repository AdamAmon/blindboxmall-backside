import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { BlindBoxComment } from '../../entity/blindbox/blindbox-comment.entity';
import { BlindBoxCommentLike } from '../../entity/blindbox/blindbox-comment-like.entity';
import { BlindBox } from '../../entity/blindbox/blindbox.entity';
import { User } from '../../entity/user/user.entity';
import { CreateBlindBoxCommentDTO, QueryBlindBoxCommentDTO } from '../../dto/blindbox/blindbox-comment.dto';

@Provide()
export class BlindBoxCommentService {
  @InjectEntityModel(BlindBoxComment)
  commentRepo: Repository<BlindBoxComment>;

  @InjectEntityModel(BlindBoxCommentLike)
  commentLikeRepo: Repository<BlindBoxCommentLike>;

  @InjectEntityModel(BlindBox)
  blindBoxRepo: Repository<BlindBox>;

  @InjectEntityModel(User)
  userRepo: Repository<User>;

  /**
   * 创建评论
   */
  async createComment(data: CreateBlindBoxCommentDTO, userId: number) {
    // 验证盲盒是否存在
    const blindBox = await this.blindBoxRepo.findOne({ where: { id: data.blind_box_id } });
    if (!blindBox) {
      throw new Error('盲盒不存在');
    }

    // 如果是回复评论，验证父评论是否存在
    if (data.parent_id) {
      const parentComment = await this.commentRepo.findOne({ where: { id: data.parent_id } });
      if (!parentComment) {
        throw new Error('回复的评论不存在');
      }
    }

    // 创建评论
    const comment = await this.commentRepo.save({
      blind_box_id: data.blind_box_id,
      user_id: userId,
      parent_id: data.parent_id,
      content: data.content,
    });

    // 更新盲盒评论计数
    await this.updateBlindBoxCommentCount(data.blind_box_id);

    return comment;
  }

  /**
   * 获取评论列表
   */
  async getComments(params: QueryBlindBoxCommentDTO) {
    const { blind_box_id, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    // 获取一级评论（不包含回复）- 使用更明确的查询条件
    const [comments, total] = await this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.blind_box_id = :blindBoxId', { blindBoxId: blind_box_id })
      .andWhere('comment.parent_id IS NULL')
      .orderBy('comment.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();



    // 获取每个评论的回复和点赞数
    const commentsWithRepliesAndLikes = await Promise.all(
      comments.map(async (comment) => {
        // 获取回复（只获取直接回复，不包含回复的回复）
        const replies = await this.commentRepo
          .createQueryBuilder('reply')
          .leftJoinAndSelect('reply.user', 'user')
          .where('reply.parent_id = :parentId', { parentId: comment.id })
          .andWhere('reply.blind_box_id = :blindBoxId', { blindBoxId: blind_box_id })
          .orderBy('reply.created_at', 'ASC')
          .getMany();

        // 获取点赞数
        const likeCount = await this.commentLikeRepo.count({
          where: { comment_id: comment.id }
        });

        return {
          ...comment,
          replies,
          like_count: likeCount,
        };
      })
    );

    return {
      list: commentsWithRepliesAndLikes,
      total, // 这里只统计一级评论的数量
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 点赞/取消点赞评论
   */
  async toggleLikeComment(commentId: number, userId: number) {
    // 验证评论是否存在
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new Error('评论不存在');
    }

    // 检查是否已点赞
    const existingLike = await this.commentLikeRepo.findOne({
      where: { comment_id: commentId, user_id: userId }
    });

    if (existingLike) {
      // 取消点赞
      await this.commentLikeRepo.delete(existingLike.id);
      return { liked: false };
    } else {
      // 添加点赞
      await this.commentLikeRepo.save({
        comment_id: commentId,
        user_id: userId,
      });
      return { liked: true };
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId: number, userId: number) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['user']
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    // 检查权限（只能删除自己的评论）
    if (comment.user_id !== userId) {
      throw new Error('无权限删除此评论');
    }

    // 删除评论及其回复
    await this.commentRepo.delete({ id: commentId });
    await this.commentRepo.delete({ parent_id: commentId });

    // 删除相关点赞
    await this.commentLikeRepo.delete({ comment_id: commentId });

    // 更新盲盒评论计数
    await this.updateBlindBoxCommentCount(comment.blind_box_id);

    return true;
  }

  /**
   * 更新盲盒评论计数
   */
    private async updateBlindBoxCommentCount(blindBoxId: number) {
    // 只统计一级评论（不包含回复）
    const commentCount = await this.commentRepo
      .createQueryBuilder('comment')
      .where('comment.blind_box_id = :blindBoxId', { blindBoxId })
      .andWhere('comment.parent_id IS NULL')
      .getCount();

    await this.blindBoxRepo.update(blindBoxId, {
      comment_count: commentCount
    });
  }

  /**
   * 获取评论详情
   */
  async getCommentById(commentId: number) {
    return await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['user', 'blindBox']
    });
  }

  /**
   * 调试方法：获取所有评论数据
   */
  async debugGetAllComments() {
    const allComments = await this.commentRepo.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return allComments.map(comment => ({
      id: comment.id,
      blind_box_id: comment.blind_box_id,
      user_id: comment.user_id,
      parent_id: comment.parent_id,
      content: comment.content,
      created_at: comment.created_at,
      user: comment.user ? {
        id: comment.user.id,
        nickname: comment.user.nickname,
        username: comment.user.username
      } : null
    }));
  }

  /**
   * 调试方法：使用原生SQL查询
   */
  async debugGetCommentsWithRawSQL(blindBoxId: number) {
    const query = `
      SELECT 
        c.id,
        c.blind_box_id,
        c.user_id,
        c.parent_id,
        c.content,
        c.created_at,
        u.nickname,
        u.username
      FROM blindbox_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.blind_box_id = ?
      ORDER BY c.created_at DESC
    `;
    
    const result = await this.commentRepo.query(query, [blindBoxId]);
    return result;
  }

  /**
   * 清理重复评论数据
   */
  async cleanDuplicateComments() {
    // 查找所有评论
    const allComments = await this.commentRepo.find({
      order: { created_at: 'ASC' },
    });

    const duplicates = [];
    const seen = new Set();

    // 查找重复的评论（相同内容、用户、时间相近）
    for (const comment of allComments) {
      const key = `${comment.content}-${comment.user_id}-${comment.blind_box_id}`;
      
      if (seen.has(key)) {
        // 找到重复，保留较早的，删除较晚的
        const existingComment = allComments.find(c => 
          c.content === comment.content && 
          c.user_id === comment.user_id && 
          c.blind_box_id === comment.blind_box_id &&
          c.id !== comment.id
        );
        
        if (existingComment && comment.created_at > existingComment.created_at) {
          duplicates.push(comment.id);
        }
      } else {
        seen.add(key);
      }
    }

    // 删除重复的评论
    if (duplicates.length > 0) {
      await this.commentRepo.delete(duplicates);
      console.log(`删除了 ${duplicates.length} 条重复评论:`, duplicates);
    }

    return duplicates;
  }
} 