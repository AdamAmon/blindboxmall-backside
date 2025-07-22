import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../../entity/pay/cart.entity';

@Provide()
export class CartService {
  @InjectEntityModel(Cart)
  cartRepo: Repository<Cart>;

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
    return this.cartRepo.find({ where: { user_id: userId } });
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