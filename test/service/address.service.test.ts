import { createApp, close } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { UserService } from '../../src/service/user/user.service';
import { AddressService } from '../../src/service/address/address.service';
import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';

const TEST_USER = {
  username: 'address_test_user',
  password: 'Test@1234',
  nickname: '地址测试用户',
  role: 'customer'
};

const TEST_ADDRESS = {
  recipient: '张三',
  phone: '13812345678',
  province: '河北',
  city: '石家庄',
  district: '长安区',
  detail: '测试路1号',
  is_default: false
};

describe('地址模块 service 层单元测试', () => {
  let app: any;
  let userService: UserService;
  let addressService: AddressService;
  let userId: number;

  beforeAll(async () => {
    app = await createApp<Framework>();
    userService = await app.getApplicationContext().getAsync(UserService);
    addressService = await app.getApplicationContext().getAsync(AddressService);
    // 创建测试用户
    const user = await userService.createUser(TEST_USER);
    userId = user.id;
  });

  afterAll(async () => {
    await close(app);
  });

  afterEach(async () => {
    // 清理该用户所有地址
    await addressService.addressModel.delete({ user_id: userId });
  });

  it('should create address for user', async () => {
    const address = await addressService.createAddress(userId, TEST_ADDRESS);
    expect(address).toBeDefined();
    expect(address.id).toBeDefined();
    expect(address.recipient).toBe(TEST_ADDRESS.recipient);
  });

  it('should throw if recipient is missing', async () => {
    const invalid = { ...TEST_ADDRESS };
    // @ts-ignore
    delete invalid.recipient;
    await expect(addressService.createAddress(userId, invalid as any)).rejects.toThrow();
  });

  it('should return empty array for new user', async () => {
    const list = await addressService.listAddresses(userId);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });

  it('should return addresses after creation', async () => {
    await addressService.createAddress(userId, TEST_ADDRESS);
    const list = await addressService.listAddresses(userId);
    expect(list.length).toBe(1);
    expect(list[0].recipient).toBe(TEST_ADDRESS.recipient);
  });

  it('should update address fields', async () => {
    const address = await addressService.createAddress(userId, TEST_ADDRESS);
    const updated = await addressService.updateAddress(userId, {
      ...address,
      recipient: '李四',
      phone: '13987654321'
    });
    expect(updated).toBeTruthy();
    const list = await addressService.listAddresses(userId);
    expect(list[0].recipient).toBe('李四');
    expect(list[0].phone).toBe('13987654321');
  });

  it('should set address as default', async () => {
    await addressService.createAddress(userId, { ...TEST_ADDRESS, is_default: false });
    const addr2 = await addressService.createAddress(userId, { ...TEST_ADDRESS, detail: '测试路2号', is_default: false });
    await addressService.setDefaultAddress(userId, addr2.id);
    const list = await addressService.listAddresses(userId);
    const defaultAddr = list.find(a => a.is_default);
    expect(defaultAddr && defaultAddr.id).toBe(addr2.id);
  });

  it('should delete address by id', async () => {
    const address = await addressService.createAddress(userId, TEST_ADDRESS);
    const result = await addressService.deleteAddress(userId, address.id);
    expect(result).toBeTruthy();
    const list = await addressService.listAddresses(userId);
    expect(list.length).toBe(0);
  });

  it('should not throw when deleting non-existent address', async () => {
    await expect(addressService.deleteAddress(userId, 999999)).rejects.toThrow('地址不存在');
  });
});