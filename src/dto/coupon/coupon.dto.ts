import { Rule, RuleType } from '@midwayjs/validate';

export class CreateCouponDTO {
  @Rule(RuleType.string().required())
  name: string;

  @Rule(RuleType.number().valid(1, 2).required())
  type: number; // 1满减 2折扣

  @Rule(RuleType.number().min(0).required())
  threshold: number;

  @Rule(RuleType.number().min(0).required())
  amount: number;

  @Rule(RuleType.date().required())
  start_time: Date;

  @Rule(RuleType.date().required())
  end_time: Date;

  @Rule(RuleType.number().min(1).required())
  total: number;

  @Rule(RuleType.string().optional())
  description?: string;
}

export class UpdateCouponDTO extends CreateCouponDTO {
  @Rule(RuleType.number().required())
  id: number;
} 