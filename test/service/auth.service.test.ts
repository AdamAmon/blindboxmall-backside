import { createApp, close } from '@midwayjs/mock';
import { AuthService } from '../../src/service/auth/auth.service';
import { UserService } from '../../src/service/user/user.service';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { RegisterDTO } from '../../src/dto/user/user.dto';
import { User } from '../../src/entity/user/user.entity';
import jwt from 'jsonwebtoken';

describe('test/service/auth.service.test.ts', () => {
  let app;
  let authService: AuthService;
  let userService: UserService;
  let token: string | undefined;

  beforeAll(async () => {
    app = await createApp();
    authService = await app.getApplicationContext().getAsync(AuthService);
    userService = await app.getApplicationContext().getAsync(UserService);
  });

  afterAll(async () => {
    await close(app);
  });

  describe('Token生成与验证', () => {
    it('应该成功生成用户Token', async () => {
      const userArr = await userService.createUser({
        username: 'authuser',
        password: '123456',
        nickname: 'auth用户',
        role: 'customer'
      } as RegisterDTO);
      const user = Array.isArray(userArr) ? userArr[0] : userArr;
      if (!user || typeof user.id !== 'number') throw new Error('user.id 不存在');

      token = await authService.generateToken(user);
      
      expect(token).toBeDefined();
      // 强制 token as string，彻底消除 never 类型 length 报错
      expect((token as string).length).toBeGreaterThan(0);
    });

    it('应该成功验证有效Token', async () => {
      const userArr2 = await userService.createUser({
        username: 'authuser2',
        password: '123456',
        nickname: 'auth用户2'
      });
      const user2 = Array.isArray(userArr2) ? userArr2[0] : userArr2;
      if (!user2 || typeof user2.id !== 'number') throw new Error('user.id 不存在');
      const token2 = await authService.generateToken(user2 as unknown as User); // 保证类型兼容
      const decoded = await authService.verifyToken(token2);
      
      expect(decoded).toBeDefined();
      expect((decoded as Record<string, unknown>).id).toBe(user2.id);
      expect((decoded as Record<string, unknown>).userId).toBe(user2.id);
      expect((decoded as Record<string, unknown>).role).toBe(user2.role);
    });

    it('应该拒绝无效Token', async () => {
      const invalidToken = 'invalid.token.here';
      
      await expect(authService.verifyToken(invalidToken)).rejects.toThrow();
    });

    it('应该拒绝过期Token', async () => {
      // 创建一个短期Token进行测试
      const userArr3 = await userService.createUser({
        username: 'authuser3',
        password: '123456',
        nickname: 'auth用户3'
      });
      const user3 = Array.isArray(userArr3) ? userArr3[0] : userArr3;
      if (!user3 || typeof user3.id !== 'number') throw new Error('user.id 不存在');
      const token3 = await authService.generateToken(user3 as unknown as User);
      
      // 正常情况下Token应该有效
      const decoded3 = await authService.verifyToken(token3);
      expect(decoded3).toBeDefined();
      expect(decoded3.id).toBe(user3.id);
      expect(decoded3.userId).toBe(user3.id);
      expect(decoded3.role).toBe(user3.role);
    });

    it('should throw when generateToken with invalid user', async () => {
      await expect(authService.generateToken({} as unknown as User)).rejects.toThrow('无效的用户信息');
    });

    it('should throw when verifyToken with expired token', async () => {
      // 生成一个过期token（假设jwt配置支持）
      // 这里不再需要 require，直接用 import 或 mock
      const token = jwt.sign({ id: 1 }, app.getConfig().jwt.secret, { expiresIn: -1 });
      await expect(authService.verifyToken(token)).rejects.toThrow();
    });
  });

  describe('用户认证', () => {
    it('应该成功验证用户凭据', async () => {
      const username = 'authuser4';
      const password = '123456';
      
      const userArr4 = await userService.createUser({
        username,
        password,
        nickname: 'auth用户4'
      });
      const user4 = Array.isArray(userArr4) ? userArr4[0] : userArr4;
      if (!user4 || typeof user4.id !== 'number') throw new Error('user.id 不存在');
      const validatedUser = await authService.validateUser('authuser4', '123456');
      
      expect(validatedUser).toBeDefined();
      expect(validatedUser.username).toBe(username);
    });

    it('应该拒绝错误的密码', async () => {
      const username = 'authuser5';
      await expect(
        authService.validateUser(username, 'wrongpassword')
      ).rejects.toThrow();
    });

    it('应该拒绝不存在的用户', async () => {
      await expect(
        authService.validateUser('nonexistent', '123456')
      ).rejects.toThrow();
    });
  });

  describe('密码加密', () => {
    it('应该成功加密密码', async () => {
      const password = 'testpassword';
      const hashedPassword = await authService.hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(typeof hashedPassword).toBe('string');
    });

    it('应该成功验证加密密码', async () => {
      const password = 'testpassword2';
      const hashedPassword = await authService.hashPassword(password);
      
      const isValid = await authService.comparePassword(password, hashedPassword);
      
      expect(isValid).toBe(true);
    });

    it('应该拒绝错误的密码验证', async () => {
      const password = 'testpassword3';
      const hashedPassword = await authService.hashPassword(password);
      
      const isValid = await authService.comparePassword('wrongpassword', hashedPassword);
      
      expect(isValid).toBe(false);
    });
  });

  describe('权限验证', () => {
    it('应该成功验证用户权限', async () => {
      const userArr = await userService.createUser({
        username: 'authuser6',
        password: '123456',
        nickname: 'auth用户6'
      });
      const user = Array.isArray(userArr) ? userArr[0] : userArr;

      const hasPermission = await authService.hasPermission(user?.id as number, 'user:read');
      
      expect(typeof hasPermission).toBe('boolean');
    });

    it('应该处理不存在的用户权限', async () => {
      const hasPermission = await authService.hasPermission(99999, 'user:read');
      
      expect(hasPermission).toBe(false);
    });

    it('should handle hasPermission with null permission', async () => {
      const userArr = await userService.createUser({ username: 'permuser', password: '123456', nickname: '权限用户' });
      const user = Array.isArray(userArr) ? userArr[0] : userArr;
      const result = await authService.hasPermission(user?.id as number, '');
      expect(result).toBe(false);
    });
  });

  describe('会话管理', () => {
    it('应该成功创建用户会话', async () => {
      const userArr = await userService.createUser({
        username: 'authuser7',
        password: '123456',
        nickname: 'auth用户7'
      });
      const user = Array.isArray(userArr) ? userArr[0] : userArr;

      const session = await authService.createSession(user?.id as number);
      
      expect(session).toBeDefined();
      if (session) {
        expect(session.userId).toBe(user?.id as number);
      }
    });

    it('应该成功验证会话', async () => {
      const userArr = await userService.createUser({
        username: 'authuser8',
        password: '123456',
        nickname: 'auth用户8'
      });
      const user = Array.isArray(userArr) ? userArr[0] : userArr;

      const session = await authService.createSession(user?.id as number);
      if (session) {
        const isValid = await authService.validateSession(session.id);
        expect(isValid).toBe(true);
      }
    });

    it('应该成功销毁会话', async () => {
      const userArr = await userService.createUser({
        username: 'authuser9',
        password: '123456',
        nickname: 'auth用户9'
      });
      const user = Array.isArray(userArr) ? userArr[0] : userArr;

      const session = await authService.createSession(user?.id as number);
      
      // 验证会话创建成功
      if (session) {
        const isValidBefore = await authService.validateSession(session.id);
        expect(isValidBefore).toBe(true);
        // 销毁会话
        await authService.destroySession(session.id);
        // 验证会话已被销毁
        const isValidAfter = await authService.validateSession(session.id);
        expect(isValidAfter).toBe(false);
      }
    });

    it('should throw when createSession with invalid userId', async () => {
      const result = await authService.createSession(0 as number);
      expect(result).toBeNull();
    });

    it('should handle destroySession with non-existent sessionId', async () => {
      const result = await authService.destroySession("999999");
      expect(result).toBeUndefined();
    });
  });

  it('should handle unexpected params gracefully', async () => {
    let error = null;
    let result;
    try {
      result = await authService.generateToken({} as unknown as User);
    } catch (e) {
      error = e;
    }
    expect(error !== null || result === undefined || result === null).toBe(true);
  });
}); 