//:src/service/user.service.ts
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entity/user/user.entity';
import * as bcrypt from 'bcryptjs';
import { MidwayHttpError } from '@midwayjs/core';
import { RegisterDTO, UpdateUserDTO } from '../../dto/user/user.dto';

@Provide()
export class UserService {
  @InjectEntityModel(User)
  userModel: Repository<User>;

  // 创建用户
  async createUser(userData: RegisterDTO) {
    const existing = await this.userModel.findOne({
      where: { username: userData.username },
    });
    if (existing) throw new MidwayHttpError('用户名已存在', 400);
    // Validate role if provided
    if (
      userData.role &&
      !['customer', 'seller', 'admin'].includes(userData.role)
    ) {
      throw new MidwayHttpError('无效的用户角色', 400);
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    return this.userModel.save({
      ...userData,
      password: hashedPassword,
      role: userData.role || 'customer',
    });
  }

  // 验证用户
  async validateUser(username: string, password: string) {
    const user = await this.userModel.findOne({ where: { username } });
    if (!user) throw new MidwayHttpError('用户不存在', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new MidwayHttpError('密码错误', 401);

    return user;
  }

  // getUser 方法
  async getUser(condition: { id: number }) {
    // 参数校验
    if (!condition.id) {
      throw new MidwayHttpError('缺少用户ID参数', 400);
    }

    const user = await this.userModel.findOne({
      where: { id: condition.id },
    });

    if (!user) {
      throw new MidwayHttpError('用户不存在', 404);
    }

    // 移除敏感数据
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * 查询用户已获得奖品，支持稀有度、名称搜索、分页
   * @param params { userId, rarity, keyword, page, limit }
   */
  async getUserPrizes(params: { userId: number, rarity?: number, keyword?: string, page?: number, limit?: number }) {
    const { userId, rarity, keyword, page = 1, limit = 10 } = params;
    // 只查已完成订单且已开盒的奖品
    const qb = this.userModel.manager.createQueryBuilder('order_items', 'oi')
      .innerJoin('orders', 'o', 'oi.order_id = o.id')
      .leftJoin('box_items', 'bi', 'oi.item_id = bi.id')
      .where('o.user_id = :userId', { userId })
      .andWhere('o.status = :status', { status: 'completed' })
      .andWhere('oi.is_opened = 1')
      .andWhere('oi.item_id IS NOT NULL');
    if (rarity) {
      qb.andWhere('bi.rarity = :rarity', { rarity });
    }
    if (keyword) {
      qb.andWhere('bi.name LIKE :keyword', { keyword: `%${keyword}%` });
    }
    qb.orderBy('oi.opened_at', 'DESC');
    qb.skip((page - 1) * limit).take(limit);
    const list = await qb.select([
      'oi.id as orderItemId',
      'oi.opened_at as openedAt',
      'bi.id as prizeId',
      'bi.name as prizeName',
      'bi.image as prizeImage',
      'bi.rarity as rarity',
      'oi.price as price'
    ]).getRawMany();
    const total = await qb.getCount();
    const result = list.map((row) => ({
      orderItemId: row.orderItemId,
      openedAt: row.openedAt,
      prizeId: row.prizeId,
      prizeName: row.prizeName,
      prizeImage: row.prizeImage,
      rarity: row.rarity,
      price: row.price
    }));
    return {
      code: 200,
      data: {
        list: result,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 更新用户信息
  async updateUser(dto: UpdateUserDTO) {
    console.log('updateUser dto:', dto);
    const user = await this.userModel.findOne({ where: { id: dto.id } });
    console.log('before update:', user);
    if (!user) throw new MidwayHttpError('用户不存在', 404);
    // 只允许更新部分字段
    const { nickname, avatar, email, phone, balance } = dto;
    if (nickname !== undefined) user.nickname = nickname;
    if (avatar !== undefined) user.avatar = avatar;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (balance !== undefined) user.balance = balance;
    const saved = await this.userModel.save(user);
    console.log('after update:', saved);
    return saved;
  }
}
