import { createApp, close } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { UserService } from '../../src/service/user/user.service';
import * as bcrypt from 'bcryptjs';
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';

// 类型化的测试用户数据
const TEST_USER = {
  username: 'test_user',
  password: 'Test@1234',
  nickname: 'Test User',
  role: 'customer'
};

describe('test/service/user.service.test.ts', () => {
  let app: any;
  let userService: UserService;

  beforeAll(async () => {
    // 创建应用实例
    app = await createApp<Framework>();
    // 获取依赖注入的服务实例
    userService = await app.getApplicationContext().getAsync(UserService);
  });

  afterAll(async () => {
    // 关闭应用
    await close(app);
  });

  // 清理测试数据
  afterEach(async () => {
    // 只删除数据库中的测试用户，不对 TEST_USER 常量做 delete 操作
    await userService.userModel.delete({ username: TEST_USER.username });
  });

  describe('createUser()', () => {
    it('should create user with hashed password', async () => {
      const user = await userService.createUser(TEST_USER);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe(TEST_USER.username);
      expect(user.role).toBe(TEST_USER.role);
      expect(user.password).not.toBe(TEST_USER.password);
      expect(user.password.length).toBeGreaterThan(20); // 验证哈希
    });

    it('should throw when duplicate username', async () => {
      await userService.createUser(TEST_USER);
      await expect(userService.createUser(TEST_USER)).rejects.toThrow(
        '用户名已存在'
      );
    });

    it('should validate role types', async () => {
      const invalidUser = { ...TEST_USER, role: 'invalid_role' };
      await expect(userService.createUser(invalidUser)).rejects.toThrow(
        '无效的用户角色'
      );
    });

    it('should set default role to customer', async () => {
      const { role, ...newUser } = TEST_USER;
      const user = await userService.createUser(newUser);
      expect(user.role).toBe('customer');
    });
  });

  describe('validateUser()', () => {
    beforeEach(async () => {
      await userService.createUser(TEST_USER);
    });

    it('should validate correct credentials', async () => {
      const user = await userService.validateUser(
        TEST_USER.username,
        TEST_USER.password
      );
      expect(user).toBeDefined();
      expect(user.username).toBe(TEST_USER.username);
    });

    it('should throw on wrong password', async () => {
      await expect(
        userService.validateUser(TEST_USER.username, 'wrong_password')
      ).rejects.toThrow('密码错误');
    });

    it('should throw on non-existent user', async () => {
      await expect(
        userService.validateUser('not_exist', TEST_USER.password)
      ).rejects.toThrow('用户不存在');
    });
  });

  describe('user entity persistence', () => {
    it('should persist and retrieve created user', async () => {
      const createdUser = await userService.createUser(TEST_USER);
      const dbUser = await userService.userModel.findOne({
        where: { id: createdUser.id }
      });

      expect(dbUser).toBeDefined();
      expect(dbUser?.username).toBe(TEST_USER.username);
      // 验证密码不可逆存储
      expect(await bcrypt.compare(TEST_USER.password, dbUser!.password)).toBe(
        true
      );
    });
  });
});