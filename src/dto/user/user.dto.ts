import { Rule, RuleType } from '@midwayjs/validate';

export class RegisterDTO {
  @Rule(RuleType.string().required().min(3).max(50))
  username: string;

  @Rule(RuleType.string().required().min(6))
  password: string;

  @Rule(RuleType.string().required().min(2).max(50))
  nickname: string;

  @Rule(RuleType.string().allow(null, '').optional())
  avatar?: string;

  @Rule(RuleType.string().email().allow(null, '').optional())
  email?: string;

  @Rule(
    RuleType.string()
      .pattern(/^1[3-9]\d{9}$/)
      .allow(null, '')
      .optional()
  )
  phone?: string;

  @Rule(RuleType.string().valid('customer', 'seller', 'admin').optional())
  role?: string;
}

export class UpdateUserDTO {
  @Rule(RuleType.number().required())
  id: number;

  @Rule(RuleType.string().min(2).max(50).optional())
  nickname?: string;

  @Rule(RuleType.string().allow(null, '').optional())
  avatar?: string;

  @Rule(RuleType.string().email().allow(null, '').optional())
  email?: string;

  @Rule(
    RuleType.string()
      .pattern(/^1[3-9]\d{9}$/)
      .allow(null, '')
      .optional()
  )
  phone?: string;
}
