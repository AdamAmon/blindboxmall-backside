// ... existing code ...
import { Provide, Inject, Config } from '@midwayjs/core';  // Add Config import
import { UserService } from './user.service';
import * as jwt from 'jsonwebtoken';
import { User } from '../entity/user.entity';
// Deleted:import { IConfigService } from '@midwayjs/core';  // Remove this

@Provide()
export class AuthService {
  @Inject()
  userService: UserService;

  // Deleted:@Inject()
  // Deleted:configService: IConfigService;

  @Config('jwt')  // Add proper configuration injection
  jwtConfig: any;  // Will hold jwt configuration

  async generateToken(user: User) {
    return jwt.sign(
      { userId: user.id, role: user.role },
      this.jwtConfig.secret,  // Use injected config
      { expiresIn: this.jwtConfig.expiresIn }
    );
  }
}
