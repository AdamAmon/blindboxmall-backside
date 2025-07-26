import { Rule, RuleType } from '@midwayjs/validate';

export class CreateOrderItemDTO {
  @Rule(RuleType.number().required())
  blind_box_id: number;

  @Rule(RuleType.number().optional())
  item_id?: number;

  @Rule(RuleType.number().required())
  price: number;
}

export class CreateOrderDTO {
  @Rule(RuleType.number().required())
  user_id: number;

  @Rule(RuleType.number().required())
  address_id: number;

  @Rule(RuleType.array().items(RuleType.object().keys({
    blind_box_id: RuleType.number().required(),
    item_id: RuleType.number().optional(),
    price: RuleType.number().required()
  })).min(1).required())
  items: CreateOrderItemDTO[];

  @Rule(RuleType.number().required())
  total_amount: number;

  @Rule(RuleType.string().valid('balance', 'alipay').required())
  pay_method: string;

  @Rule(RuleType.number().optional())
  user_coupon_id?: number;

  @Rule(RuleType.number().optional().min(0))
  discount_amount?: number;
} 