/* eslint-disable @typescript-eslint/no-var-requires */
// bootstrap.js

const { Bootstrap } = require('@midwayjs/bootstrap');

Bootstrap.configure({
  imports: require('./dist/index'),
  moduleDetector: false,
}).run();
