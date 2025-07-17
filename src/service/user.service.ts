//:src/service/user.service.ts
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import * as bcrypt from 'bcryptjs';
import { MidwayHttpError } from '@midwayjs/core';
import { UserAddress } from '../entity/user_address.entity';

@Provide()
export class UserService {
  @InjectEntityModel(User)
  userModel: Repository<User>;

  @InjectEntityModel(UserAddress)
  addressModel: Repository<UserAddress>;

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
    const user = await this.userModel.findOne({ where: { id: dto.id } });
    if (!user) throw new MidwayHttpError('用户不存在', 404);
    // 只允许更新部分字段
    const { nickname, avatar, email, phone } = dto;
    if (nickname !== undefined) user.nickname = nickname;
    if (avatar !== undefined) user.avatar = avatar;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    return this.userModel.save(user);
  }

  // 新增地址
  async createAddress(userId: number, dto: any) {
    if (dto.is_default) {
      // 取消原有默认地址
      await this.addressModel.update({ user_id: userId, is_default: true }, { is_default: false });
    }
    const address = this.addressModel.create({ ...dto, user_id: userId });
    return this.addressModel.save(address);
  }

  // 更新地址
  async updateAddress(userId: number, dto: any) {
    const address = await this.addressModel.findOne({ where: { id: dto.id, user_id: userId, is_deleted: false } });
    if (!address) throw new MidwayHttpError('地址不存在', 404);
    if (dto.is_default) {
      await this.addressModel.update({ user_id: userId, is_default: true }, { is_default: false });
    }
    Object.assign(address, dto);
    return this.addressModel.save(address);
  }

  // 软删除地址
  async deleteAddress(userId: number, id: number) {
    const address = await this.addressModel.findOne({ where: { id, user_id: userId, is_deleted: false } });
    if (!address) throw new MidwayHttpError('地址不存在', 404);
    address.is_deleted = true;
    return this.addressModel.save(address);
  }

  // 查询地址列表
  async listAddresses(userId: number) {
    return this.addressModel.find({ where: { user_id: userId, is_deleted: false }, order: { is_default: 'DESC', id: 'DESC' } });
  }

  // 设置默认地址
  async setDefaultAddress(userId: number, id: number) {
    const address = await this.addressModel.findOne({ where: { id, user_id: userId, is_deleted: false } });
    if (!address) throw new MidwayHttpError('地址不存在', 404);
    await this.addressModel.update({ user_id: userId, is_default: true }, { is_default: false });
    address.is_default = true;
    await this.addressModel.save(address);
    // 同步到 user 表
    await this.userModel.update({ id: userId }, { default_address_id: id });
    return address;
  }
}
