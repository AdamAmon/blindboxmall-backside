import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { UserAddress } from '../../entity/address/user_address.entity';
import { MidwayHttpError } from '@midwayjs/core';
import { CreateAddressDTO, UpdateAddressDTO } from '../../dto/address/address.dto';

@Provide()
export class AddressService {
  @InjectEntityModel(UserAddress)
  addressModel: Repository<UserAddress>;

  // 创建地址
  async createAddress(userId: number, dto: CreateAddressDTO): Promise<UserAddress> {
    if (!userId || typeof userId !== 'number') {
      throw new Error('userId 非法');
    }
    if (Array.isArray(dto)) {
      throw new Error('只支持单个地址对象');
    }
    if (dto.is_default) {
      await this.addressModel.update(
        { user_id: userId, is_default: true },
        { is_default: false }
      );
    }
    const address = this.addressModel.create({ ...dto, user_id: userId });
    const result = await this.addressModel.save(address);
    if (Array.isArray(result)) {
      return result[0];
    }
    return result;
  }

  // 更新地址
  async updateAddress(userId: number, dto: UpdateAddressDTO): Promise<UserAddress> {
    if (!userId || typeof userId !== 'number' || !dto || typeof dto.id !== 'number') {
      throw new Error('userId 或 addressId 非法');
    }
    const address = await this.addressModel.findOne({
      where: { id: dto.id, user_id: userId, is_deleted: false },
    });
    if (!address) throw new MidwayHttpError('地址不存在', 404);
    if (dto.is_default) {
      await this.addressModel.update(
        { user_id: userId, is_default: true },
        { is_default: false }
      );
    }
    Object.assign(address, dto);
    return this.addressModel.save(address);
  }

  // 删除地址
  async deleteAddress(userId: number, addressId: number): Promise<UserAddress> {
    if (!userId || typeof userId !== 'number' || !addressId || typeof addressId !== 'number') {
      throw new Error('userId 或 addressId 非法');
    }
    const address = await this.addressModel.findOne({
      where: { id: addressId, user_id: userId, is_deleted: false },
    });
    if (!address) throw new MidwayHttpError('地址不存在', 404);
    // 逻辑删除
    address.is_deleted = true;
    return this.addressModel.save(address);
  }

  // 获取地址列表
  async listAddresses(userId: number) {
    return this.addressModel.find({
      where: { user_id: userId, is_deleted: false },
      order: { is_default: 'DESC', id: 'DESC' },
    });
  }

  // 设置默认地址
  async setDefaultAddress(userId: number, addressId: number): Promise<UserAddress> {
    if (!userId || typeof userId !== 'number' || !addressId || typeof addressId !== 'number') {
      throw new Error('userId 或 addressId 非法');
    }
    const address = await this.addressModel.findOne({
      where: { id: addressId, user_id: userId, is_deleted: false },
    });
    if (!address) throw new MidwayHttpError('地址不存在', 404);
    await this.addressModel.update(
      { user_id: userId, is_default: true },
      { is_default: false }
    );
    address.is_default = true;
    await this.addressModel.save(address);
    // 注意：如需同步到 user 表，请在 controller/service 层注入 UserService 处理
    return address;
  }
}
