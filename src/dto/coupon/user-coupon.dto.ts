import { Rule, RuleType } from '@midwayjs/validate';

export class ReceiveCouponDTO {
  @Rule(RuleType.number().required())
  coupon_id: number;
}

export class UseCouponDTO {
  @Rule(RuleType.number().required())
  user_coupon_id: number;
} 