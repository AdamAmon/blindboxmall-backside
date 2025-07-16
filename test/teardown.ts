// 测试结束后的全局清理
import { rm } from 'fs/promises';
import { join } from 'path';

module.exports = async () => {
  // 再次清理测试数据库文件
  const testDbPath = join(__dirname, '../test.sqlite');
  try {
    await rm(testDbPath, { force: true });
  } catch (error) {
    console.warn('Clean test db error:', error);
  }
};
