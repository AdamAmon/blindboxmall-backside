import { Controller, Get, Post, Put, Del, Body, Query, Param, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { BlindBoxService } from '../../service/blindbox/blindbox.service';
import {
  CreateBlindBoxDTO,
  UpdateBlindBoxDTO,
  QueryBlindBoxDTO,
  DrawBlindBoxDTO,
  CreateBoxItemDTO,
  UpdateBoxItemDTO,
} from '../../dto/blindbox/blindbox.dto';

/**
 * 盲盒管理控制器
 */
@Controller('/api/blindbox')
export class BlindBoxController {
  @Inject()
  blindBoxService: BlindBoxService;

  /**
   * 创建盲盒
   * @POST /api/blindbox
   */
  @Post('/')
  async create(@Body() createDto: CreateBlindBoxDTO) {
    try {
      // 使用前端传递的seller_id，不再硬编码
      const result = await this.blindBoxService.create(createDto);
      return {
        code: 200,
        message: '创建成功',
        data: result,
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message || '创建失败',
      };
    }
  }

  /**
   * 更新盲盒
   * @PUT /api/blindbox/:id
   */
  @Put('/:id')
  async update(@Param('id') id: number, @Body() updateDto: UpdateBlindBoxDTO) {
    try {
      updateDto.id = id;
      const result = await this.blindBoxService.update(updateDto);
      return {
        code: 200,
        message: '更新成功',
        data: result,
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message || '更新失败',
      };
    }
  }

  /**
   * 删除盲盒
   * @DELETE /api/blindbox/:id
   */
  @Del('/:id')
  async delete(@Param('id') id: number) {
    try {
      const result = await this.blindBoxService.delete(id);
      if (result) {
        return {
          code: 200,
          message: '删除成功',
        };
      } else {
        return {
          code: 404,
          message: '盲盒不存在',
        };
      }
    } catch (error) {
      return {
        code: 500,
        message: error.message || '删除失败',
      };
    }
  }

  /**
   * 获取盲盒详情
   * @GET /api/blindbox/:id
   */
  @Get('/:id')
  async findById(@Param('id') id: number) {
    try {
      const result = await this.blindBoxService.findById(id);
      if (result) {
        return {
          code: 200,
          message: '获取成功',
          data: result,
        };
      } else {
        return {
          code: 404,
          message: '盲盒不存在',
        };
      }
    } catch (error) {
      return {
        code: 500,
        message: error.message || '获取失败',
      };
    }
  }

  /**
   * 分页查询盲盒列表
   * @GET /api/blindbox
   */
  @Get('/')
  async findList(@Query() queryDto: QueryBlindBoxDTO) {
    try {
      const result = await this.blindBoxService.findList(queryDto);
      return {
        code: 200,
        message: '查询成功',
        data: result,
      };
    } catch (error) {
      console.error('查询盲盒列表失败:', error);
      return {
        code: 500,
        message: error.message || '查询失败',
      };
    }
  }

  /**
   * 抽奖
   * @POST /api/blindbox/draw
   */
  @Post('/draw')
  async draw(@Body() drawDto: DrawBlindBoxDTO, ctx: Context) {
    try {
      // 从JWT token中获取用户ID
      const userId = ctx.user?.id;
      if (!userId) {
        return {
          code: 401,
          message: '用户未登录或token无效',
        };
      }
      
      const result = await this.blindBoxService.drawBlindBox(userId, drawDto);
      return {
        code: 200,
        message: '抽奖成功',
        data: result,
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message || '抽奖失败',
      };
    }
  }

  /**
   * 获取盲盒商品列表
   * @GET /api/blindbox/:id/items
   */
  @Get('/:id/items')
  async getBoxItems(@Param('id') blindBoxId: number) {
    try {
      const result = await this.blindBoxService.getBoxItems(blindBoxId);
      return {
        code: 200,
        message: '获取成功',
        data: result,
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message || '获取失败',
      };
    }
  }

  /**
   * 创建盲盒商品
   * @POST /api/blindbox/items
   */
  @Post('/items')
  async createBoxItem(@Body() createDto: CreateBoxItemDTO) {
    try {
      const result = await this.blindBoxService.createBoxItems([createDto]);
      return {
        code: 200,
        message: '创建成功',
        data: result[0],
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message || '创建失败',
      };
    }
  }

  /**
   * 更新盲盒商品
   * @PUT /api/blindbox/items/:id
   */
  @Put('/items/:id')
  async updateBoxItem(@Param('id') id: number, @Body() updateDto: UpdateBoxItemDTO) {
    try {
      const { id: _, ...updateData } = updateDto;
      const result = await this.blindBoxService.updateBoxItem(id, updateData);
      return {
        code: 200,
        message: '更新成功',
        data: result,
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message || '更新失败',
      };
    }
  }

  /**
   * 删除盲盒商品
   * @DELETE /api/blindbox/items/:id
   */
  @Del('/items/:id')
  async deleteBoxItem(@Param('id') id: number) {
    try {
      const result = await this.blindBoxService.deleteBoxItem(id);
      if (result) {
        return {
          code: 200,
          message: '删除成功',
        };
      } else {
        return {
          code: 404,
          message: '商品不存在',
        };
      }
    } catch (error) {
      return {
        code: 500,
        message: error.message || '删除失败',
      };
    }
  }

  /**
   * 获取商家统计数据
   * @GET /api/blindbox/seller/stats
   */
  @Get('/seller/stats')
  async getSellerStats(ctx: Context) {
    try {
      // 从JWT token中获取用户ID
      const userId = ctx.user?.id;
      if (!userId) {
        return {
          code: 401,
          message: '用户未登录或token无效',
        };
      }
      
      const stats = await this.blindBoxService.getSellerStats(userId);
      return {
        code: 200,
        message: '获取成功',
        data: stats,
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message || '获取失败',
      };
    }
  }

  /**
   * 测试数据库连接
   * @GET /api/blindbox/test
   */
  @Get('/test')
  async testDatabase() {
    try {
      // 测试查询所有盲盒
      const allBlindBoxes = await this.blindBoxService.blindBoxRepo.find();
      console.log('数据库中的盲盒数量:', allBlindBoxes.length);
      
      // 测试查询用户
      const allUsers = await this.blindBoxService.userRepo.find();
      console.log('数据库中的用户数量:', allUsers.length);
      
      return {
        code: 200,
        message: '数据库连接正常',
        data: {
          blindBoxesCount: allBlindBoxes.length,
          usersCount: allUsers.length,
          sampleBlindBoxes: allBlindBoxes.slice(0, 3),
          sampleUsers: allUsers.slice(0, 3)
        }
      };
    } catch (error) {
      console.error('数据库测试失败:', error);
      return {
        code: 500,
        message: '数据库连接失败: ' + error.message,
      };
    }
  }

  /**
   * 测试查询参数
   * @GET /api/blindbox/debug
   */
  @Get('/debug')
  async debugQuery(@Query() queryDto: any) {
    try {
      const allBlindBoxes = await this.blindBoxService.blindBoxRepo.find();
      
      return {
        code: 200,
        message: '调试信息',
        data: {
          queryParams: queryDto,
          sellerIdType: typeof queryDto.seller_id,
          sellerIdValue: queryDto.seller_id,
          allBlindBoxes: allBlindBoxes
        }
      };
    } catch (error) {
      console.error('调试失败:', error);
      return {
        code: 500,
        message: '调试失败: ' + error.message,
      };
    }
  }
} 