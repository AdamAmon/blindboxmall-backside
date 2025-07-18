//:src/controller/auth.controller.ts
import { Controller, Inject, Post, Body } from '@midwayjs/core';
import { UserService } from '../../service/user/user.service';
import { AuthService } from '../../service/auth/auth.service';
import { RegisterDTO } from '../../dto/user/user.dto'; // 需创建DTO

@Controller('/api/auth')
export class AuthController {
  @Inject()
  userService: UserService;

  @Inject()
  authService: AuthService;

  @Post('/register')
  async register(@Body() registerDto: RegisterDTO) {
    const user = await this.userService.createUser(registerDto);
    return {
      code: 200,
      result: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar || '/default-avatar.png'
      },
      message: '注册成功'
    };
  }

  @Post('/login')
  async login(@Body() body: { username: string, password: string }) {
    const user = await this.userService.validateUser(body.username, body.password);
    const token = await this.authService.generateToken(user);

    return {
      code: 200,
      result: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        }
      },
      message: '登录成功'
    };
  }
}
