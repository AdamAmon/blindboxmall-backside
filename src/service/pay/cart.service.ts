import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../../entity/pay/cart.entity';
import { BlindBox } from '../../entity/blindbox/blindbox.entity';

@Provide()
export class CartService {
  @InjectEntityModel(Cart)
  cartRepo: Repository<Cart>;

  @InjectEntityModel(BlindBox)
  blindBoxRepo: Repository<BlindBox>;

  async addToCart(userId: number, blindBoxId: number, quantity: number) {
    let cartItem = await this.cartRepo.findOne({ where: { user_id: userId, blind_box_id: blindBoxId } });
    if (cartItem) {
      cartItem.quantity += quantity;
      return this.cartRepo.save(cartItem);
    } else {
      cartItem = this.cartRepo.create({ user_id: userId, blind_box_id: blindBoxId, quantity });
      return this.cartRepo.save(cartItem);
    }
  }

  async getCartList(userId: number) {
    const cartList = await this.cartRepo.find({ where: { user_id: userId } });
    // 查询盲盒详情并组装
    const result = [];
    for (const item of cartList) {
      const blindBox = await this.blindBoxRepo.findOne({ where: { id: item.blind_box_id } });
      result.push({ ...item, blindBox });
    }
    return result;
  }

  async updateCartItem(cartId: number, quantity: number) {
    const cartItem = await this.cartRepo.findOne({ where: { id: cartId } });
    if (!cartItem) return null;
    cartItem.quantity = quantity;
    return this.cartRepo.save(cartItem);
  }

  async deleteCartItem(cartId: number) {
    return this.cartRepo.delete(cartId);
  }

  async clearCart(userId: number) {
    return this.cartRepo.delete({ user_id: userId });
  }
} 