// 运行测试前的全局设置
import { rm } from 'fs/promises';
import { join } from 'path';

module.exports = async () => {
  // 清理可能的测试数据库文件
  const testDbPath = join(__dirname, '../test.sqlite');
  try {
    await rm(testDbPath, { force: true });
  } catch (error) {
    console.warn('Clean test db error:', error);
  }
};
