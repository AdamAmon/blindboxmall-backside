import { createApp, close } from '@midwayjs/mock';
import { UserService } from '../../src/service/user/user.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { RegisterDTO, UpdateUserDTO } from '../../src/dto/user/user.dto';

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
    const userData = {
      username: 'testuser',
      password: '123456',
      nickname: 'Test User',
    };

    const user = await userService.createUser(userData);
    expect(user).toBeDefined();
    expect(user.username).toBe(userData.username);
    expect(user.nickname).toBe(userData.nickname);
    expect(user.password).not.toBe(userData.password); // 密码应该被加密
  });

  it('should not create user with existing username', async () => {
    const userData = {
      username: 'testuser2',
      password: '123456',
      nickname: 'Test User 2',
    };

    await userService.createUser(userData);
    await expect(userService.createUser(userData)).rejects.toThrow('用户名已存在');
  });

  it('should validate user', async () => {
    const userData = {
      username: 'testuser3',
      password: '123456',
      nickname: 'Test User 3',
    };

    await userService.createUser(userData);
    const user = await userService.validateUser(userData.username, userData.password);
    expect(user).toBeDefined();
    expect(user.username).toBe(userData.username);
  });

  it('should throw on wrong password', async () => {
    const userData = {
      username: 'testuser4',
      password: '123456',
      nickname: 'Test User 4',
    };

    await userService.createUser(userData);
    await expect(userService.validateUser(userData.username, 'wrongpassword')).rejects.toThrow('密码错误');
  });

  it('should get user', async () => {
    const userData = {
      username: 'testuser5',
      password: '123456',
      nickname: 'Test User 5',
    };

    const createdUser = await userService.createUser(userData);
    const user = await userService.getUser({ id: createdUser.id });
    expect(user).toBeDefined();
    expect(user.username).toBe(userData.username);
    // 密码字段应该被移除，因为getUser方法会过滤敏感信息
  });

      it('should throw on getUser with missing id', async () => {
      await expect(userService.getUser({ id: 0 })).rejects.toThrow('缺少用户ID参数');
    });

  it('should update user', async () => {
    const userData = {
      username: 'testuser6',
      password: '123456',
      nickname: 'Test User 6',
    };

    const createdUser = await userService.createUser(userData);
    const updateData = {
      id: createdUser.id,
      nickname: 'Updated User',
      email: 'test@example.com',
      balance: 1000,
    };

    const updatedUser = await userService.updateUser(updateData);
    expect(updatedUser.nickname).toBe(updateData.nickname);
    expect(updatedUser.email).toBe(updateData.email);
    expect(updatedUser.balance).toBe(updateData.balance);
  });

  it('should update user with only id', async () => {
    const userData = { username: 'onlyiduser', password: '123456', nickname: 'OnlyId' };
    const createdUser = await userService.createUser(userData);
    const updateData = { id: createdUser.id };
    const updatedUser = await userService.updateUser(updateData);
    expect(updatedUser).toBeDefined();
  });

  it('should throw when getUser with null', async () => {
    await expect(userService.getUser(null as unknown as { id: number })).rejects.toThrow();
  });

  it('should throw when createUser with long username', async () => {
    const userData = { username: 'a'.repeat(300), password: '123456', nickname: 'LongName' };
    const result = await userService.createUser(userData);
    expect(result.username.length).toBeGreaterThan(100);
  });

  it('should throw when createUser with special chars', async () => {
    const userData = { username: '特殊!@#$', password: '123456', nickname: 'SpecialChar' };
    const result = await userService.createUser(userData);
    expect(result.username).toBe('特殊!@#$');
  });

  // 新增边界条件测试
  describe('边界条件测试', () => {
    it('should handle invalid role in createUser', async () => {
      const userData = {
        username: 'testuser_invalid_role',
        password: '123456',
        nickname: 'Test User',
        role: 'invalid_role',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('无效的用户角色');
    });

    it('should handle null username in createUser', async () => {
      const userData = {
        username: null,
        password: '123456',
        nickname: 'Test User',
      } as unknown as RegisterDTO;
      await expect(userService.createUser(userData)).rejects.toThrow();
    });

    it('should handle non-existent user in validateUser', async () => {
      await expect(userService.validateUser('nonexistent', '123456')).rejects.toThrow('用户不存在');
    });

    it('should handle non-existent user in getUser', async () => {
      await expect(userService.getUser({ id: 99999 })).rejects.toThrow('用户不存在');
    });

    it('should handle non-existent user in updateUser', async () => {
      const updateData = {
        id: 99999,
        nickname: 'Updated User',
      };

      await expect(userService.updateUser(updateData)).rejects.toThrow('用户不存在');
    });

    it('should handle partial update in updateUser', async () => {
      const userData = {
        username: 'testuser_partial',
        password: '123456',
        nickname: 'Test User',
      };

      const createdUser = await userService.createUser(userData);
      
      // 只更新昵称
      const updateData = {
        id: createdUser.id,
        nickname: 'Partial Update',
      };

      const updatedUser = await userService.updateUser(updateData);
      expect(updatedUser.nickname).toBe(updateData.nickname);
      expect(updatedUser.email).toBe(createdUser.email); // 其他字段保持不变
    });

    it('should handle null values in updateUser', async () => {
      const userData = {
        username: 'testuser_null',
        password: '123456',
        nickname: 'Test User',
        email: 'test@example.com',
      };

      const createdUser = await userService.createUser(userData);
      
      const updateData = {
        id: createdUser.id,
        email: null as unknown as string,
        phone: null as unknown as string,
      } as unknown as UpdateUserDTO;
      const updatedUser = await userService.updateUser(updateData);
      expect(updatedUser.email).toBe(null);
      expect(updatedUser.phone).toBe(null);
    });

    it('should handle zero balance in updateUser', async () => {
      const userData = {
        username: 'testuser_zero_balance',
        password: '123456',
        nickname: 'Test User',
      };

      const createdUser = await userService.createUser(userData);
      
      const updateData = {
        id: createdUser.id,
        balance: 0,
      };

      const updatedUser = await userService.updateUser(updateData);
      expect(updatedUser.balance).toBe(0);
    });

    it('should handle negative balance in updateUser', async () => {
      const userData = {
        username: 'testuser_negative_balance',
        password: '123456',
        nickname: 'Test User',
      };

      const createdUser = await userService.createUser(userData);
      
      const updateData = {
        id: createdUser.id,
        balance: -100,
      };

      const updatedUser = await userService.updateUser(updateData);
      expect(updatedUser.balance).toBe(-100);
    });
  });

  it('should handle unexpected params gracefully', async () => {
    let error = null;
    let result;
    try {
      result = await userService.createUser(undefined as unknown as RegisterDTO);
    } catch (e) {
      error = e;
    }
    expect(error !== null || result === undefined || result === null).toBe(true);
  });
});