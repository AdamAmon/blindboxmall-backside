// 运行测试前的全局设置
import { rm } from 'fs/promises';
import { join } from 'path';

// 全局 mock 掉 setTimeout 和 setInterval，防止定时器泄漏
if (typeof jest !== 'undefined') {
  jest.spyOn(global, 'setTimeout').mockImplementation((_fn, _t) => {
    void _fn; void _t;
    return {
      ref: () => {},
      unref: () => {},
    } as unknown as NodeJS.Timeout;
  });
  jest.spyOn(global, 'setInterval').mockImplementation((_fn, _t) => {
    void _fn; void _t;
    return {
      ref: () => {},
      unref: () => {},
    } as unknown as NodeJS.Timeout;
  });
}

module.exports = async () => {
  // 清理可能的测试数据库文件
  const testDbPath = join(__dirname, '../test.sqlite');
  try {
    await rm(testDbPath, { force: true });
  } catch (error) {
    console.warn('Clean test db error:', error);
  }
};
