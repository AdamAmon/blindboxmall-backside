export class AddToCartDTO {
  user_id: number;
  blind_box_id: number;
  quantity: number;
}

export class UpdateCartItemDTO {
  cart_id: number;
  quantity: number;
}

export class DeleteCartItemDTO {
  cart_id: number;
}

export class ClearCartDTO {
  user_id: number;
} 