import { Rule, RuleType } from '@midwayjs/validate';

export class CreateOrderItemDTO {
  @Rule(RuleType.number().required())
  blind_box_id: number;

  @Rule(RuleType.number().required())
  item_id: number;

  @Rule(RuleType.number().required())
  price: number;
}

export class CreateOrderDTO {
  @Rule(RuleType.number().required())
  user_id: number;

  @Rule(RuleType.number().required())
  address_id: number;

  @Rule(RuleType.array().items(RuleType.object().instance(CreateOrderItemDTO)).min(1).required())
  items: CreateOrderItemDTO[];

  @Rule(RuleType.number().required())
  total_amount: number;

  @Rule(RuleType.string().valid('balance', 'alipay').required())
  pay_method: string;
} 