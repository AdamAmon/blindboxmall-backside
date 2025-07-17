//:src/dto/user.dto.ts
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

  @Rule(RuleType.string().pattern(/^1[3-9]\d{9}$/).allow(null, '').optional())
  phone?: string;

  @Rule(RuleType.string().valid('customer', 'seller', 'admin',).optional())
  role?: string;
}

export class CreateAddressDTO {
  @Rule(RuleType.string().required().min(2).max(50))
  recipient: string;

  @Rule(RuleType.string().required().pattern(/^1[3-9]\d{9}$/))
  phone: string;

  @Rule(RuleType.string().required().max(50))
  province: string;

  @Rule(RuleType.string().required().max(50))
  city: string;

  @Rule(RuleType.string().required().max(50))
  district: string;

  @Rule(RuleType.string().required().max(255))
  detail: string;

  @Rule(RuleType.boolean().optional())
  is_default?: boolean;
}

export class UpdateAddressDTO extends CreateAddressDTO {
  @Rule(RuleType.number().required())
  id: number;
}

export class DeleteAddressDTO {
  @Rule(RuleType.number().required())
  id: number;
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

  @Rule(RuleType.string().pattern(/^1[3-9]\d{9}$/).allow(null, '').optional())
  phone?: string;
}
