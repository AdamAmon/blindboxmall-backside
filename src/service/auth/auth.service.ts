import { Provide, Inject, Config } from '@midwayjs/core';
import { UserService } from '../user/user.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entity/user/user.entity';
import { MidwayHttpError } from '@midwayjs/core';

@Provide()
export class AuthService {
  @Inject()
  userService: UserService;

  @Config('jwt')
  jwtConfig: { secret: string; expiresIn: string };

  private destroyedSessions: Set<string> = new Set();

  async generateToken(user: User) {
    if (!user || typeof user !== 'object' || !('id' in user) || !user.id) {
      throw new Error('无效的用户信息');
    }
    // 只允许 string 或 number，且类型断言为 number | string
    let expiresIn: string | number | undefined = undefined;
    if (typeof this.jwtConfig.expiresIn === 'string' || typeof this.jwtConfig.expiresIn === 'number') {
      expiresIn = this.jwtConfig.expiresIn as string | number;
    }
    return jwt.sign(
      { 
        id: user.id, 
        userId: user.id, 
        role: user.role,
        username: user.username,
        nickname: user.nickname
      },
      this.jwtConfig.secret,
      expiresIn !== undefined ? ({ expiresIn } as unknown as import('jsonwebtoken').SignOptions) : undefined
    );
  }

  async verifyToken(token: string): Promise<Record<string, unknown>> {
    try {
      return jwt.verify(token, this.jwtConfig.secret) as Record<string, unknown>;
    } catch (error) {
      throw new MidwayHttpError('Token验证失败', 401);
    }
  }

  async validateUser(username: string, password: string) {
    const user = await this.userService.validateUser(username, password);
    return user;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async hasPermission(userId: number, permission: string): Promise<boolean> {
    try {
      const user = await this.userService.getUser({ id: userId });
      if (!user) {
        return false;
      }

      // 简单的权限检查逻辑
      if (permission === 'user:read') {
        return user.role === 'admin' || user.role === 'customer';
      }

      return user.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  async createSession(userId: number) {
    // 简单的session创建逻辑
    if (!userId) {
      return null;
    }
    return {
      id: `session_${userId}_${Date.now()}`,
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
    };
  }

  async validateSession(sessionId: string): Promise<boolean> {
    // 简单的session验证逻辑
    if (this.destroyedSessions && this.destroyedSessions.has(sessionId)) {
      return false;
    }
    return sessionId.startsWith('session_');
  }

  async destroySession(sessionId: string): Promise<void> {
    // 简单的session销毁逻辑
    // 在实际应用中，这里会从数据库中删除session记录
    // 为了测试目的，我们标记session为已销毁
    this.destroyedSessions.add(sessionId);
  }
}
