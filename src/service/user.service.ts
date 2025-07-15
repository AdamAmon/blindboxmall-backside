//:src/service/user.service.ts
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
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
}
