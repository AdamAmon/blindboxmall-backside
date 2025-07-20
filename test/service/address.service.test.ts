import { createApp, close } from '@midwayjs/mock';
import { AddressService } from '../../src/service/address/address.service';
import { UserService } from '../../src/service/user/user.service';
import { RegisterDTO } from '../../src/dto/user/user.dto';
import { CreateAddressDTO, UpdateAddressDTO } from '../../src/dto/address/address.dto';

describe('test/service/address.service.test.ts', () => {
  let app;
  let addressService: AddressService;
  let userService: UserService;
  let userId: number;
  beforeAll(async () => {
    app = await createApp();
    addressService = await app.getApplicationContext().getAsync(AddressService);
    userService = await app.getApplicationContext().getAsync(UserService);
    // 先创建用户
    const userArr = await userService.createUser({ username: 'addressuser', password: '123456', nickname: '地址用户', role: 'customer' } as RegisterDTO);
    const user = Array.isArray(userArr) ? userArr[0] : userArr;
    if (!user || typeof user.id !== 'number') throw new Error('user.id 不存在');
    userId = user.id;
  });
  afterAll(async () => {
    await close(app);
  });

  it('should create address', async () => {
    const dto: CreateAddressDTO = { recipient: '张三', phone: '13800000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'xx路1号' };
    const result = await addressService.createAddress(userId, dto);
    expect(result).toBeDefined();
  });

  it('should update address', async () => {
    const dto: CreateAddressDTO = { recipient: '李四', phone: '13900000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'yy路2号' };
    const created = await addressService.createAddress(userId, dto);
    const updateDto: UpdateAddressDTO = { id: created?.id as number, recipient: '王五', phone: '13900000003', province: created.province, city: created.city, district: created.district, detail: created.detail };
    const result = await addressService.updateAddress(userId, updateDto);
    expect(result).toBeDefined();
  });

  it('should delete address', async () => {
    const dto: CreateAddressDTO = { recipient: '赵六', phone: '13700000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'zz路3号' };
    const created = await addressService.createAddress(userId, dto);
    const result = await addressService.deleteAddress(userId, created?.id as number);
    expect(result).toBeDefined();
  });

  it('should fail to create address with invalid userId', async () => {
    const dto: CreateAddressDTO = { recipient: '张三', phone: '13800000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'xx路1号' };
    await expect(addressService.createAddress(null as unknown as number, dto)).rejects.toThrow();
  });

  it('should fail to update non-existent address', async () => {
    const updateDto: UpdateAddressDTO = { id: 99999, recipient: '王五', phone: '13900000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'yy路2号' };
    await expect(addressService.updateAddress(userId, updateDto)).rejects.toThrow();
  });

  it('should fail to delete non-existent address', async () => {
    await expect(addressService.deleteAddress(userId, 99999)).rejects.toThrow();
  });

  it('should list addresses', async () => {
    const list = await addressService.listAddresses(userId);
    expect(Array.isArray(list)).toBe(true);
  });

  it('should return empty array when listing addresses for user with no addresses', async () => {
    const newUserArr = await userService.createUser({ username: 'emptyuser', password: '123456', nickname: '空用户' });
    const newUser = Array.isArray(newUserArr) ? newUserArr[0] : newUserArr;
    if (!newUser || typeof newUser.id !== 'number') throw new Error('user.id 不存在');
    const list = await addressService.listAddresses(newUser.id);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });

  it('should not change default address if already default', async () => {
    const dto: CreateAddressDTO = { recipient: '默认', phone: '13800000002', province: '江苏', city: '南京', district: '鼓楼', detail: '默认路' };
    const created = await addressService.createAddress(userId, dto);
    await addressService.setDefaultAddress(userId, created?.id as number);
    // 再次设置同一个为默认
    const result = await addressService.setDefaultAddress(userId, created?.id as number);
    expect(result).toBeDefined();
  });

  it('should update address with partial fields', async () => {
    const dto: CreateAddressDTO = { recipient: '部分更新', phone: '13800000003', province: '江苏', city: '南京', district: '鼓楼', detail: '部分路' };
    const created = await addressService.createAddress(userId, dto);
    const updateDto: UpdateAddressDTO = {
      id: created?.id as number,
      recipient: created.recipient,
      phone: '13900000003',
      province: created.province,
      city: created.city,
      district: created.district,
      detail: created.detail
    };
    const result = await addressService.updateAddress(userId, updateDto);
    expect(result).toBeDefined();
    expect(result.phone).toBe('13900000003');
  });

  it('should throw when createAddress with empty object', async () => {
    await expect(addressService.createAddress(userId, {} as unknown as CreateAddressDTO)).rejects.toThrow();
  });

  it('should fail to list addresses with invalid userId', async () => {
    const result = await addressService.listAddresses(null as unknown as number);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should set default address', async () => {
    const dto: CreateAddressDTO = { recipient: '默认', phone: '13800000001', province: '江苏', city: '南京', district: '鼓楼', detail: '默认路' };
    const created = await addressService.createAddress(userId, dto);
    const result = await addressService.setDefaultAddress(userId, created?.id as number);
    expect(result).toBeDefined();
  });

  it('should fail to set default address with non-existent id', async () => {
    await expect(addressService.setDefaultAddress(userId, 99999)).rejects.toThrow();
  });

  it('should fail to set default address with invalid userId', async () => {
    await expect(addressService.setDefaultAddress(null as unknown as number, 1)).rejects.toThrow('userId 或 addressId 非法');
  });

  it('should handle unexpected params gracefully', async () => {
    let error = null;
    let result;
    try {
      result = await addressService.createAddress(undefined as unknown as number, null as unknown as CreateAddressDTO);
    } catch (e) {
      error = e;
    }
    expect(error !== null || result === undefined || result === null).toBe(true);
  });

  describe('异常与分支补充', () => {
    it('should throw when createAddress with null', async () => {
      await expect(addressService.createAddress(null as unknown as number, {} as unknown as CreateAddressDTO)).rejects.toThrow();
    });
    it('should throw when updateAddress with null', async () => {
      await expect(addressService.updateAddress(null as unknown as number, {} as unknown as UpdateAddressDTO)).rejects.toThrow();
    });
    it('should throw when deleteAddress with null', async () => {
      await expect(addressService.deleteAddress(null as unknown as number, null as unknown as number)).rejects.toThrow();
    });
  });
});

describe('AddressService 边界与异常分支补充', () => {
  let addressService;
  let userId;
  beforeAll(async () => {
    const app = await createApp();
    addressService = await app.getApplicationContext().getAsync(AddressService);
    const userService = await app.getApplicationContext().getAsync(UserService);
    const user = await userService.createUser({ username: 'addresstest_extra', password: '123456', nickname: '异常用户' });
    userId = user.id;
  });

  it('createAddress dto为数组', async () => {
    await expect(addressService.createAddress(userId, [{} as CreateAddressDTO])).rejects.toThrow('只支持单个地址对象');
  });
  it('updateAddress 地址不存在', async () => {
    await expect(addressService.updateAddress(userId, { id: 999999 } as unknown as UpdateAddressDTO)).rejects.toThrow('地址不存在');
  });
  it('deleteAddress 地址不存在', async () => {
    await expect(addressService.deleteAddress(userId, 999999)).rejects.toThrow('地址不存在');
  });
  it('setDefaultAddress 地址不存在', async () => {
    await expect(addressService.setDefaultAddress(userId, 999999)).rejects.toThrow('地址不存在');
  });
});