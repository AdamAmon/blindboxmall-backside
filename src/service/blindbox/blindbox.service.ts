import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository, In } from 'typeorm';
import { BlindBox } from '../../entity/blindbox/blindbox.entity';
import { BoxItem } from '../../entity/blindbox/box-item.entity';
import { User } from '../../entity/user/user.entity';
import {
  CreateBlindBoxDTO,
  UpdateBlindBoxDTO,
  DrawBlindBoxDTO,
  CreateBoxItemDTO,
} from '../../dto/blindbox/blindbox.dto';
import { MidwayHttpError } from '@midwayjs/core';
import { DataSource } from 'typeorm';

@Provide()
export class BlindBoxService {
  @InjectEntityModel(BlindBox)
  blindBoxRepo: Repository<BlindBox>;

  @InjectEntityModel(BoxItem)
  boxItemRepo: Repository<BoxItem>;

  @InjectEntityModel(User)
  userRepo: Repository<User>;

  constructor(private readonly dataSource: DataSource) {}

  /**
   * 创建盲盒
   */
  async create(createDto: CreateBlindBoxDTO): Promise<BlindBox> {
    const blindBox = this.blindBoxRepo.create(createDto);
    return await this.blindBoxRepo.save(blindBox);
  }

  /**
   * 更新盲盒
   */
  async update(updateDto: UpdateBlindBoxDTO): Promise<BlindBox> {
    const { id, ...updateData } = updateDto;
    await this.blindBoxRepo.update(id, updateData);
    const updated = await this.blindBoxRepo.findOne({ where: { id } });
    if (!updated) {
      throw new MidwayHttpError('盲盒不存在', 404);
    }
    return updated;
  }

  /**
   * 删除盲盒
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.blindBoxRepo.delete(id);
    return result.affected > 0;
  }

  /**
   * 获取盲盒详情
   */
  async findById(id: number): Promise<BlindBox> {
    const box = await this.blindBoxRepo.findOne({
      where: { id },
      relations: ['boxItems'],
    });
    if (!box) {
      throw new MidwayHttpError('盲盒不存在', 404);
    }
    return box;
  }

  /**
   * 分页查询盲盒列表（支持多条件筛选和排序）
   */
  async findList(params: {
    page?: number;
    limit?: number;
    keyword?: string;
    status?: number;
    minPrice?: number;
    maxPrice?: number;
    rarity?: string;
    sortBy?: string;
    order?: string;
    category?: string;
    seller_id?: number;
  }) {
    const {
      page = 1,
      limit = 10,
      keyword,
      status,
      minPrice,
      maxPrice,
      rarity,
      sortBy = 'created_at',
      order = 'desc',
      category,
      seller_id
    } = params;

    // 构建基础查询条件
    const whereConditions: string[] = [];
    const parameters: Record<string, unknown> = {};

    // 关键词搜索（支持名称和描述）
    if (keyword) {
      whereConditions.push('(blindBox.name LIKE :keyword OR blindBox.description LIKE :keyword)');
      parameters.keyword = `%${keyword}%`;
    }
    
    // 状态筛选
    if (status !== undefined) {
      whereConditions.push('blindBox.status = :status');
      parameters.status = Number(status);
    }
    
    // 商家筛选
    if (seller_id) {
      whereConditions.push('blindBox.seller_id = :seller_id');
      parameters.seller_id = seller_id;
    }
    
    // 价格区间筛选
    if (minPrice !== undefined) {
      whereConditions.push('blindBox.price >= :minPrice');
      parameters.minPrice = minPrice;
    }
    if (maxPrice !== undefined) {
      whereConditions.push('blindBox.price <= :maxPrice');
      parameters.maxPrice = maxPrice;
    }

    // 构建查询构建器
    let queryBuilder = this.blindBoxRepo.createQueryBuilder('blindBox')
      .leftJoinAndSelect('blindBox.boxItems', 'boxItems');

    // 应用WHERE条件
    if (whereConditions.length > 0) {
      queryBuilder = queryBuilder.where(whereConditions.join(' AND '), parameters);
    }

    // 稀有度筛选
    if (rarity) {
      const rarityArray = rarity.split(',').map(r => Number(r.trim()));
      queryBuilder = queryBuilder.andWhere('boxItems.rarity IN (:...rarity)', { rarity: rarityArray });
    }

    // 分类筛选（按稀有度分组）
    if (category && category !== 'all') {
      let rarityValue: number;
      switch (category) {
        case 'common':
          rarityValue = 1;
          break;
        case 'rare':
          rarityValue = 2;
          break;
        case 'hidden':
          rarityValue = 3;
          break;
        default:
          rarityValue = 1;
      }
      queryBuilder = queryBuilder.andWhere('boxItems.rarity = :categoryRarity', { categoryRarity: rarityValue });
    }

    // 应用排序和分页
    queryBuilder = queryBuilder
      .orderBy(`blindBox.${sortBy}`, order.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [list, total] = await queryBuilder.getManyAndCount();

    return { 
      list, 
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: number) {
    const box = await this.blindBoxRepo.findOne({ where: { id } });
    return box || null;
  }

  /**
   * 抽奖逻辑
   */
  async drawBlindBox(userId: number, drawDto: DrawBlindBoxDTO) {
    const { blind_box_id, quantity = 1 } = drawDto;

    // 检查盲盒是否存在且上架
    const blindBox = await this.blindBoxRepo.findOne({
      where: { id: blind_box_id, status: 1 },
    });
    if (!blindBox) {
      throw new MidwayHttpError('盲盒不存在或已下架', 404);
    }

    // 检查库存
    if (blindBox.stock < quantity) {
      throw new MidwayHttpError('库存不足', 400);
    }

    // 检查用户余额
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const totalCost = blindBox.price * quantity;
    if (user.balance < totalCost) {
      throw new MidwayHttpError('余额不足', 400);
    }

    // 获取盲盒商品列表
    const boxItems = await this.boxItemRepo.find({
      where: { blind_box_id },
    });

    if (boxItems.length === 0) {
      throw new MidwayHttpError('盲盒商品配置错误', 400);
    }

    // 验证概率总和是否为1
    const totalProbability = boxItems.reduce((sum: number, item: { probability: number }) => sum + Number(item.probability), 0);
    if (Math.abs(totalProbability - 1) > 0.001) {
      throw new MidwayHttpError('商品概率配置错误，总和必须为1', 400);
    }

    const results = [];

    // 执行抽奖
    for (let i = 0; i < quantity; i++) {
      const drawnItem = this.drawRandomItem(boxItems as BoxItem[]);
      results.push(drawnItem);
    }

    // 更新库存和用户余额
    await this.blindBoxRepo.update(blind_box_id, {
      stock: blindBox.stock - quantity,
    });

    await this.userRepo.update(userId, {
      balance: user.balance - totalCost,
    });

    return {
      blindBox,
      drawnItems: results,
      totalCost,
      remainingBalance: user.balance - totalCost,
    };
  }

  /**
   * 随机抽取商品（基于概率）
   */
  private drawRandomItem(boxItems: BoxItem[]): BoxItem {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const item of boxItems) {
      cumulativeProbability += Number(item.probability);
      if (random <= cumulativeProbability) {
        return item;
      }
    }

    // 兜底返回最后一个商品
    return boxItems[boxItems.length - 1];
  }

  /**
   * 按盲盒ID抽取单个商品（供订单抽奖调用）
   */
  async drawRandomItemByBoxId(blindBoxId: number): Promise<BoxItem> {
    const boxItems = await this.boxItemRepo.find({ where: { blind_box_id: blindBoxId } });
    if (!boxItems.length) throw new MidwayHttpError('盲盒商品配置错误', 400);
    // 验证概率总和是否为1
    const totalProbability = boxItems.reduce((sum, item) => sum + Number(item.probability), 0);
    if (Math.abs(totalProbability - 1) > 0.001) {
      throw new MidwayHttpError('商品概率配置错误，总和必须为1', 400);
    }
    return this.drawRandomItem(boxItems);
  }

  /**
   * 批量创建盲盒商品
   */
  async createBoxItems(boxItems: CreateBoxItemDTO[]): Promise<BoxItem[]> {
    const items = this.boxItemRepo.create(boxItems);
    return await this.boxItemRepo.save(items);
  }

  /**
   * 获取盲盒商品列表
   */
  async getBoxItems(blindBoxId: number): Promise<BoxItem[]> {
    return await this.boxItemRepo.find({
      where: { blind_box_id: blindBoxId },
      order: { rarity: 'ASC' },
    });
  }

  /**
   * 更新盲盒商品
   */
  async updateBoxItem(id: number, updateData: Partial<BoxItem>): Promise<BoxItem | null> {
    await this.boxItemRepo.update(id, updateData);
    return await this.boxItemRepo.findOne({ where: { id } });
  }

  /**
   * 删除盲盒商品
   */
  async deleteBoxItem(id: number): Promise<boolean> {
    const result = await this.boxItemRepo.delete(id);
    return result.affected > 0;
  }

  /**
   * 获取商家统计数据
   */
  async getSellerStats(sellerId: number) {
    // 获取总盲盒数
    const totalBlindBoxes = await this.blindBoxRepo.count({
      where: { seller_id: sellerId }
    });

    // 获取上架盲盒数
    const listedBlindBoxes = await this.blindBoxRepo.count({
      where: { seller_id: sellerId, status: 1 }
    });

    // 获取该商家的所有盲盒ID
    const sellerBlindBoxes = await this.blindBoxRepo.find({
      where: { seller_id: sellerId },
      select: ['id', 'stock', 'status', 'price']
    });
    
    const blindBoxIds = sellerBlindBoxes.map(box => box.id);

    // 获取总商品数
    let totalItems = 0;
    if (blindBoxIds.length > 0) {
      totalItems = await this.boxItemRepo.count({
        where: { blind_box_id: In(blindBoxIds) }
      });
    }

    // 计算库存剩余
    const totalStock = sellerBlindBoxes.reduce((sum, box) => sum + (box.stock || 0), 0);

    // 计算总价值（所有盲盒的价格 * 库存）
    const totalValue = sellerBlindBoxes.reduce((sum, box) => {
      return sum + (Number(box.price) * (box.stock || 0));
    }, 0);

    return {
      totalBlindBoxes,
      listedBlindBoxes,
      totalItems,
      totalStock,
      totalValue,
    };
  }

  /**
   * 获取盲盒分类统计（按稀有度分组）
   */
  async getCategoryStats() {
    const stats = await this.boxItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.blindBox', 'blindBox')
      .select('item.rarity', 'rarity')
      .addSelect('COUNT(DISTINCT blindBox.id)', 'blindBoxCount')
      .addSelect('COUNT(item.id)', 'itemCount')
      .where('blindBox.status = :status', { status: 1 })
      .groupBy('item.rarity')
      .getRawMany();

    const categoryMap = {
      1: 'common',
      2: 'rare', 
      3: 'hidden'
    };

    const result = {
      common: { blindBoxCount: 0, itemCount: 0 },
      rare: { blindBoxCount: 0, itemCount: 0 },
      hidden: { blindBoxCount: 0, itemCount: 0 }
    };

    stats.forEach(stat => {
      const category = categoryMap[stat.rarity];
      if (category) {
        result[category] = {
          blindBoxCount: parseInt(stat.blindBoxCount),
          itemCount: parseInt(stat.itemCount)
        };
      }
    });

    return result;
  }

  /**
   * 获取热门搜索关键词
   */
  async getHotKeywords() {
    // 这里可以实现搜索历史统计，暂时返回一些示例关键词
    return [
      '潮玩',
      '手办',
      '限定',
      '联名',
      '盲盒',
      '收藏'
    ];
  }
} 