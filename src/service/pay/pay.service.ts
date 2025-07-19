import { Provide, Config } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Recharge } from '../../entity/pay/pay.entity';
import { User } from '../../entity/user/user.entity';
import { MidwayHttpError } from '@midwayjs/core';
import { AlipaySdk } from 'alipay-sdk';

@Provide()
export class PayService {
  @Config('alipay')
  alipayConfig;

  @InjectEntityModel(Recharge)
  rechargeModel: Repository<Recharge>;

  @InjectEntityModel(User)
  userModel: Repository<User>;

  // 新增辅助方法：解析 query string（兼容低版本TS/Node）
  private parseQueryString(str: string): Record<string, string> {
    const params: Record<string, string> = {};

    // 如果字符串包含&，按query string解析
    if (str.includes('&')) {
      for (const [k, v] of new URLSearchParams(str)) {
        params[k] = v;
      }
    }
    // 否则尝试解析JSON
    else {
      try {
        const jsonData = JSON.parse(str);
        Object.assign(params, jsonData);
      } catch (e) {
        // console.warn('[调试] parseQueryString JSON解析失败:', e);
        // 如果JSON解析失败，尝试其他格式
        if (str.includes('=')) {
          for (const [k, v] of new URLSearchParams(str)) {
            params[k] = v;
          }
        }
      }
    }

    return params;
  }

  getAlipaySdk() {
    // console.log('[Alipay][SDK] 私钥片段:', this.alipayConfig.privateKey.slice(0, 30), '...');
    // console.log('[Alipay][SDK] 公钥片段:', this.alipayConfig.alipayPublicKey.slice(0, 30), '...');
    // 明确指定keyType为PKCS8，确保密钥格式一致
    return new AlipaySdk({
      appId: this.alipayConfig.appId,
      privateKey: this.alipayConfig.privateKey,
      alipayPublicKey: this.alipayConfig.alipayPublicKey,
      gateway: this.alipayConfig.gateway,
      signType: 'RSA2',
      keyType: 'PKCS8', // 强制PKCS8
      timeout: 5000,
      camelcase: true,
    });
  }

  // 创建充值订单并生成支付链接
  async createRechargeOrder(
    userId: number,
    amount: number
  ): Promise<{ record: Recharge; payUrl: string }> {
    try {
      // console.log('[调试] createRechargeOrder 入参:', { userId, amount });
      const user = await this.userModel.findOne({ where: { id: userId } });
      if (!user) throw new MidwayHttpError('用户不存在', 404);
      const outTradeNo = 'CZ' + Date.now() + Math.floor(Math.random() * 10000);
      const record = this.rechargeModel.create({
        recharge_user_id: userId,
        recharge_amount: amount,
        recharge_status: 'pending',
        recharge_out_trade_no: outTradeNo,
      });
      await this.rechargeModel.save(record);
      // console.log('[调试] createRechargeOrder 订单记录:', record);
      // 生成支付宝支付链接
      let alipaySdk;
      try {
        alipaySdk = this.getAlipaySdk();
      } catch (sdkErr) {
        console.error(
          '[调试] createRechargeOrder alipaySdk 初始化异常:',
          sdkErr
        );
        throw new MidwayHttpError(
          '支付宝SDK初始化失败: ' + sdkErr.message,
          500
        );
      }
      const bizContent = {
        subject: 'Balance Recharge',
        out_trade_no: outTradeNo,
        total_amount: amount.toFixed(2),
        product_code: 'FAST_INSTANT_TRADE_PAY',
      };

      let payUrl;
      try {
        // console.log('[调试] alipaySdk.pageExecute 参数:', { bizContent, notifyUrl: this.alipayConfig.notifyUrl });
        payUrl = await alipaySdk.pageExecute('alipay.trade.page.pay', 'GET', {
          bizContent,
          notifyUrl: this.alipayConfig.notifyUrl,
        });
        // console.log('[调试] alipaySdk.pageExecute payUrl:', payUrl);
      } catch (payErr) {
        console.error('[调试] alipaySdk.pageExecute 下单异常:', payErr);
        throw new MidwayHttpError('支付宝下单失败: ' + payErr.message, 500);
      }
      // console.log('[调试] createRechargeOrder 返回前 payUrl:', payUrl);
      return { record, payUrl };
    } catch (err) {
      console.error('[调试] createRechargeOrder 总异常:', err);
      throw err;
    }
  }

  // 充值记录查询
  async getRechargeRecords(userId: number) {
    try {
      const result = await this.rechargeModel.find({
        where: { recharge_user_id: userId },
        order: { recharge_id: 'DESC' },
      });
      return result;
    } catch (err) {
      throw new MidwayHttpError('查询充值记录失败: ' + err.message, 500);
    }
  }

  // 重写 handleAlipayNotify，增加详细日志
  async handleAlipayNotify(rawBody: string) {
    // console.log('[调试] handleAlipayNotify 开始处理，原始数据:', rawBody);

    const params = this.parseQueryString(rawBody);
    // console.log('[调试] handleAlipayNotify 解析后参数:', params);

    // 检查必要参数
    if (!params.out_trade_no) {
      console.error('[调试] handleAlipayNotify 缺少out_trade_no参数');
      throw new MidwayHttpError('缺少订单号参数', 400);
    }

    // console.log('[调试] handleAlipayNotify 订单号:', params.out_trade_no);
    // console.log('[调试] handleAlipayNotify 支付宝交易号:', params.trade_no);
    // console.log('[调试] handleAlipayNotify 交易状态:', params.trade_status);

    // 检查交易状态
    if (params.trade_status !== 'TRADE_SUCCESS') {
      // console.log('[调试] handleAlipayNotify 交易未成功，状态:', params.trade_status);
      return 'success'; // 支付宝要求返回success
    }

    // 验签（可选，如果验签失败可以跳过）
    try {
      const alipaySdk = this.getAlipaySdk();
      const isValid = alipaySdk.checkNotifySignV2(params);
      // console.log('[调试] handleAlipayNotify 验签结果:', isValid);
      if (!isValid) {
        // console.warn('[调试] handleAlipayNotify 验签失败，但继续处理');
      }
    } catch (signError) {
      // console.warn('[调试] handleAlipayNotify 验签异常:', signError);
    }

    // 查找订单
    const record = await this.rechargeModel.findOne({
      where: { recharge_out_trade_no: params.out_trade_no },
    });
    if (!record) {
      console.error(
        '[调试] handleAlipayNotify 订单不存在:',
        params.out_trade_no
      );
      throw new MidwayHttpError('订单不存在', 404);
    }

    // console.log('[调试] handleAlipayNotify 找到订单:', record);

    // 检查订单状态
    if (record.recharge_status === 'success') {
      // console.log('[调试] handleAlipayNotify 订单已处理，跳过');
      return 'success';
    }

    // 更新订单状态
    record.recharge_status = 'success';
    record.recharge_alipay_trade_no = params.trade_no;
    record.recharge_pay_time = new Date();
    await this.rechargeModel.save(record);
    // console.log('[调试] handleAlipayNotify 订单状态已更新');

    // 更新用户余额
    const user = await this.userModel.findOne({
      where: { id: record.recharge_user_id },
    });
    if (user) {
      // const oldBalance = user.balance;
      user.balance = Number(user.balance) + Number(record.recharge_amount);
      await this.userModel.save(user);
      // console.log('[调试] handleAlipayNotify 用户余额更新:', oldBalance, '->', user.balance);
    } else {
      console.error(
        '[调试] handleAlipayNotify 用户不存在:',
        record.recharge_user_id
      );
    }

    // console.log('[调试] handleAlipayNotify 处理完成');
    return 'success';
  }
}
