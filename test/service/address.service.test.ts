import { createApp, close } from '@midwayjs/mock';
import { AddressService } from '../../src/service/address/address.service';
import { UserService } from '../../src/service/user/user.service';

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
    const user = await userService.createUser({ username: 'addressuser', password: '123456', nickname: '地址用户' });
    userId = user.id;
  });
  afterAll(async () => {
    await close(app);
  });

  it('should create address', async () => {
    const dto = { recipient: '张三', phone: '13800000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'xx路1号' };
    const result = await addressService.createAddress(userId, dto);
    expect(result).toBeDefined();
  });

  it('should update address', async () => {
    const dto = { recipient: '李四', phone: '13900000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'yy路2号' };
    const created = await addressService.createAddress(userId, dto);
    const updateDto = { ...created, recipient: '王五' };
    const result = await addressService.updateAddress(userId, updateDto);
    expect(result).toBeDefined();
  });

  it('should delete address', async () => {
    const dto = { recipient: '赵六', phone: '13700000000', province: '江苏', city: '南京', district: '鼓楼', detail: 'zz路3号' };
    const created = await addressService.createAddress(userId, dto);
    const result = await addressService.deleteAddress(userId, created.id);
    expect(result).toBeDefined();
  });
});