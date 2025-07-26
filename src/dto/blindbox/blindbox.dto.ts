import { Rule, RuleType } from '@midwayjs/validate';

export class CreateBlindBoxDTO {
  @Rule(RuleType.string().required().max(100))
  name: string;

  @Rule(RuleType.string().optional().max(1000))
  description?: string;

  @Rule(RuleType.number().required().min(0))
  price: number;

  @Rule(RuleType.string().required().max(255))
  cover_image: string;

  @Rule(RuleType.number().required().min(0))
  stock: number;

  @Rule(RuleType.number().valid(0, 1).default(1))
  status?: number;

  @Rule(RuleType.number().required())
  seller_id: number;
}

export class UpdateBlindBoxDTO {
  @Rule(RuleType.number().optional())
  id?: number;

  @Rule(RuleType.string().optional().max(100))
  name?: string;

  @Rule(RuleType.string().optional().max(1000))
  description?: string;

  @Rule(RuleType.number().optional().min(0))
  price?: number;

  @Rule(RuleType.string().optional().max(255))
  cover_image?: string;

  @Rule(RuleType.number().optional().min(0))
  stock?: number;

  @Rule(RuleType.number().optional().valid(0, 1))
  status?: number;
}

export class CreateBoxItemDTO {
  @Rule(RuleType.number().required())
  blind_box_id: number;

  @Rule(RuleType.string().required().max(100))
  name: string;

  @Rule(RuleType.string().required().max(255))
  image: string;

  @Rule(RuleType.number().required().valid(1, 2, 3))
  rarity: number;

  @Rule(RuleType.number().required().min(0).max(1))
  probability: number;
}

export class UpdateBoxItemDTO {
  @Rule(RuleType.number().optional())
  id?: number;

  @Rule(RuleType.string().optional().max(100))
  name?: string;

  @Rule(RuleType.string().optional().max(255))
  image?: string;

  @Rule(RuleType.number().optional().valid(1, 2, 3))
  rarity?: number;

  @Rule(RuleType.number().optional().min(0).max(1))
  probability?: number;
}

export class QueryBlindBoxDTO {
  @Rule(RuleType.string().optional().default('1'))
  page?: string;

  @Rule(RuleType.string().optional().default('10'))
  limit?: string;

  @Rule(RuleType.string().optional().allow(''))
  keyword?: string;

  @Rule(RuleType.string().optional())
  status?: string;

  @Rule(RuleType.string().optional())
  seller_id?: string;

  // 新增价格区间筛选
  @Rule(RuleType.number().optional().min(0))
  minPrice?: number;

  @Rule(RuleType.number().optional().min(0))
  maxPrice?: number;

  // 新增稀有度筛选（支持多个，如 "1,2,3"）
  @Rule(RuleType.string().optional())
  rarity?: string;

  // 新增排序字段
  @Rule(RuleType.string().optional().valid('price', 'created_at', 'name', 'stock'))
  sortBy?: string;

  // 新增排序方式
  @Rule(RuleType.string().optional().valid('asc', 'desc').default('desc'))
  order?: string;

  // 新增分类筛选（按稀有度分组）
  @Rule(RuleType.string().optional().valid('all', 'common', 'rare', 'hidden'))
  category?: string;
}

export class DrawBlindBoxDTO {
  @Rule(RuleType.number().required())
  blind_box_id: number;

  @Rule(RuleType.number().optional().default(1))
  quantity?: number;
} 