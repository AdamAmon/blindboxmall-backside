import { Rule, RuleType } from '@midwayjs/validate';

export class CreateAddressDTO {
  @Rule(RuleType.string().required().min(2).max(50))
  recipient: string;

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^1[3-9]\d{9}$/)
  )
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
