import { Rule, RuleType } from '@midwayjs/validate';

export class CreateBlindBoxCommentDTO {
  @Rule(RuleType.number().required())
  blind_box_id: number;

  @Rule(RuleType.string().required().min(1).max(500))
  content: string;

  @Rule(RuleType.number().optional())
  parent_id?: number;
}

export class QueryBlindBoxCommentDTO {
  @Rule(RuleType.number().required())
  blind_box_id: number;

  @Rule(RuleType.number().optional().default(1))
  page?: number;

  @Rule(RuleType.number().optional().default(10))
  limit?: number;
}

export class LikeBlindBoxCommentDTO {
  @Rule(RuleType.number().required())
  comment_id: number;
} 