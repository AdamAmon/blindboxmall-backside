import { createApp, close } from '@midwayjs/mock';
import { UserService } from '../../src/service/user/user.service';

describe('test/service/user.service.test.ts', () => {
  let app;
  let userService: UserService;
  beforeAll(async () => {
    app = await createApp();
    userService = await app.getApplicationContext().getAsync(UserService);
  });
  afterAll(async () => {
    await close(app);
  });

  it('should create user', async () => {
    const user = await userService.createUser({ username: 'userx', password: '123456', nickname: '用户x' });
    expect(user).toBeDefined();
  });

  it('should not create user with existing username', async () => {
    await userService.createUser({ username: 'userx2', password: '123456', nickname: '用户x2' });
    await expect(userService.createUser({ username: 'userx2', password: '123456', nickname: '用户x2' })).rejects.toThrow();
  });

  it('should validate user', async () => {
    await userService.createUser({ username: 'userx3', password: '123456', nickname: '用户x3' });
    const user = await userService.validateUser('userx3', '123456');
    expect(user).toBeDefined();
  });

  it('should throw on wrong password', async () => {
    await userService.createUser({ username: 'userx4', password: '123456', nickname: '用户x4' });
    await expect(userService.validateUser('userx4', 'wrong')).rejects.toThrow();
  });

  it('should get user', async () => {
    const user = await userService.createUser({ username: 'userx5', password: '123456', nickname: '用户x5' });
    const got = await userService.getUser({ id: user.id });
    expect(got).toBeDefined();
  });

  it('should throw on getUser with missing id', async () => {
    await expect(userService.getUser({ id: -1 })).rejects.toThrow();
  });

  it('should update user', async () => {
    const user = await userService.createUser({ username: 'userx6', password: '123456', nickname: '用户x6' });
    const updated = await userService.updateUser({ id: user.id, nickname: '新昵称' });
    expect(updated.nickname).toBe('新昵称');
  });
});