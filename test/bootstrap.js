// 自动扫描 src/controller 目录，确保 jest 测试时 controller 路由可用
const { join } = require('path');
module.exports = { imports: [join(__dirname, '../src/controller')] }; 