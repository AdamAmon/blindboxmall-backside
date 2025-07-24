import { Rule, RuleType } from '@midwayjs/validate';

export class CreateShowDTO {
  @Rule(RuleType.number().required())
  user_id: number;

  @Rule(RuleType.number().required())
  item_id: number;

  @Rule(RuleType.number().required())
  order_item_id: number;

  @Rule(RuleType.string().required())
  content: string;

  @Rule(RuleType.array().items(RuleType.string()).optional())
  images?: string[];
}

export class CreateCommentDTO {
  @Rule(RuleType.number().required())
  show_id: number;

  @Rule(RuleType.number().required())
  user_id: number;

  @Rule(RuleType.string().required())
  content: string;

  @Rule(RuleType.number().optional())
  parent_id?: number;
}

export class LikeDTO {
  @Rule(RuleType.number().required())
  user_id: number;

  @Rule(RuleType.number().required())
  show_id?: number;

  @Rule(RuleType.number().optional())
  comment_id?: number;
} 