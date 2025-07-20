import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { BlindBox } from '../../entity/blindbox/blindbox.entity';
import { BoxItem } from '../../entity/blindbox/box-item.entity';
import { User } from '../../entity/user/user.entity';
import {
  CreateBlindBoxDTO,
  UpdateBlindBoxDTO,
  QueryBlindBoxDTO,
  DrawBlindBoxDTO,
} from '../../dto/blindbox/blindbox.dto';

@Provide()
export class BlindBoxService {
  @InjectEntityModel(BlindBox)
  blindBoxRepo: Repository<BlindBox>;

  @InjectEntityModel(BoxItem)
  boxItemRepo: Repository<BoxItem>;

  @InjectEntityModel(User)
  userRepo: Repository<User>;

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
    return await this.blindBoxRepo.findOne({ where: { id } });
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
    return await this.blindBoxRepo.findOne({
      where: { id },
      relations: ['boxItems'],
    });
  }

  /**
   * 分页查询盲盒列表
   */
  async findList(queryDto: QueryBlindBoxDTO) {
    const { page = '1', limit = '10', keyword, status, seller_id } = queryDto;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const whereCondition: any = {};
    if (keyword) {
      whereCondition.name = Like(`%${keyword}%`);
    }
    if (status !== undefined && status !== null && status !== '') {
      whereCondition.status = parseInt(status);
    }
    if (seller_id !== undefined && seller_id !== null && seller_id !== '') {
      // 确保seller_id是数字类型
      whereCondition.seller_id = parseInt(seller_id);
    }

    console.log('查询条件:', whereCondition); // 添加调试日志

    const [list, total] = await this.blindBoxRepo.findAndCount({
      where: whereCondition,
      skip,
      take: limitNum,
      order: { created_at: 'DESC' },
      relations: ['seller'],
    });

    return {
      list,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
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
      throw new Error('盲盒不存在或已下架');
    }

    // 检查库存
    if (blindBox.stock < quantity) {
      throw new Error('库存不足');
    }

    // 检查用户余额
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const totalCost = blindBox.price * quantity;
    if (user.balance < totalCost) {
      throw new Error('余额不足');
    }

    // 获取盲盒商品列表
    const boxItems = await this.boxItemRepo.find({
      where: { blind_box_id },
    });

    if (boxItems.length === 0) {
      throw new Error('盲盒商品配置错误');
    }

    // 验证概率总和是否为1
    const totalProbability = boxItems.reduce((sum, item) => sum + Number(item.probability), 0);
    if (Math.abs(totalProbability - 1) > 0.001) {
      throw new Error('商品概率配置错误，总和必须为1');
    }

    const results = [];

    // 执行抽奖
    for (let i = 0; i < quantity; i++) {
      const drawnItem = this.drawRandomItem(boxItems);
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
   * 批量创建盲盒商品
   */
  async createBoxItems(boxItems: any[]): Promise<BoxItem[]> {
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
  async updateBoxItem(id: number, updateData: Partial<BoxItem>): Promise<BoxItem> {
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
      select: ['id']
    });
    
    const blindBoxIds = sellerBlindBoxes.map(box => box.id);

    // 获取总商品数
    let totalItems = 0;
    if (blindBoxIds.length > 0) {
      totalItems = await this.boxItemRepo.count({
        where: { blind_box_id: In(blindBoxIds) }
      });
    }

    // 获取总销量（这里暂时返回0，因为订单系统还未实现）
    const totalSales = 0;

    return {
      totalBlindBoxes,
      listedBlindBoxes,
      totalItems,
      totalSales
    };
  }
} 