// 自动扫描 src/controller 目录，确保 jest 测试时 controller 路由可用
import { join } from 'path';
export const imports = [join(__dirname, '../src/controller')]; 