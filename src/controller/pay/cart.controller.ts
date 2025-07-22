import { Controller, Post, Get, Body, Query, Inject } from '@midwayjs/core';
import { CartService } from '../../service/pay/cart.service';
import { AddToCartDTO, UpdateCartItemDTO, DeleteCartItemDTO, ClearCartDTO } from '../../dto/pay/cart.dto';

@Controller('/api/cart')
export class CartController {
  @Inject()
  cartService: CartService;

  @Post('/add')
  async addToCart(@Body() body: AddToCartDTO) {
    const { user_id, blind_box_id, quantity } = body;
    const result = await this.cartService.addToCart(user_id, blind_box_id, quantity);
    return { success: true, data: result };
  }

  @Get('/list')
  async getCartList(@Query('user_id') userId: number) {
    const result = await this.cartService.getCartList(userId);
    return { success: true, data: result };
  }

  @Post('/update')
  async updateCartItem(@Body() body: UpdateCartItemDTO) {
    const { cart_id, quantity } = body;
    const result = await this.cartService.updateCartItem(cart_id, quantity);
    return { success: true, data: result };
  }

  @Post('/delete')
  async deleteCartItem(@Body() body: DeleteCartItemDTO) {
    const { cart_id } = body;
    const result = await this.cartService.deleteCartItem(cart_id);
    return { success: true, data: result };
  }

  @Post('/clear')
  async clearCart(@Body() body: ClearCartDTO) {
    const { user_id } = body;
    const result = await this.cartService.clearCart(user_id);
    return { success: true, data: result };
  }
} 