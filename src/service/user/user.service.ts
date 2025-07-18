//:src/service/user.service.ts
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entity/user/user.entity';
import * as bcrypt from 'bcryptjs';
import { MidwayHttpError } from '@midwayjs/core';

@Provide()
export class UserService {
  @InjectEntityModel(User)
  userModel: Repository<User>;



  // 创建用户
  async createUser(userData: any) {
    const existing = await this.userModel.findOne({ where: { username: userData.username } });
    if (existing) throw new MidwayHttpError('用户名已存在', 400);

    // Validate role if provided
    if (userData.role && !['customer', 'seller', 'admin'].includes(userData.role)) {
      throw new MidwayHttpError('无效的用户角色', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    return this.userModel.save({
      ...userData,
      password: hashedPassword,
      role: userData.role || 'customer'
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
      where: { id: condition.id }
    });

    if (!user) {
      throw new MidwayHttpError('用户不存在', 404);
    }

    // 移除敏感数据
    const { password, ...safeUser } = user;
    return safeUser;
  }

  // 更新用户信息
  async updateUser(dto: any) {
    console.log('updateUser dto:', dto);
    const user = await this.userModel.findOne({ where: { id: dto.id } });
    console.log('before update:', user);
    if (!user) throw new MidwayHttpError('用户不存在', 404);
    // 只允许更新部分字段
    const { nickname, avatar, email, phone } = dto;
    if (nickname !== undefined) user.nickname = nickname;
    if (avatar !== undefined) user.avatar = avatar;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    const saved = await this.userModel.save(user);
    console.log('after update:', saved);
    return saved;
  }

}
