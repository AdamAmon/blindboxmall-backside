import { createApp, close } from '@midwayjs/mock';
import { AuthService } from '../../src/service/auth/auth.service';
import { UserService } from '../../src/service/user/user.service';

describe('test/service/auth.service.test.ts', () => {
  let app;
  let authService: AuthService;
  let userService: UserService;
  beforeAll(async () => {
    app = await createApp();
    authService = await app.getApplicationContext().getAsync(AuthService);
    userService = await app.getApplicationContext().getAsync(UserService);
  });
  afterAll(async () => {
    await close(app);
  });

  it('should generate token', async () => {
    const user = await userService.createUser({ username: 'authuser', password: '123456', nickname: 'auth用户' });
    const token = await authService.generateToken(user);
    expect(token).toBeDefined();
  });
}); 