package com.shpms.silverharvestsystem.service;

import com.shpms.silverharvestsystem.dto.CartDTO;

import java.util.List;

public interface CartService {
    CartDTO addToCart(CartDTO cartDTO);
    CartDTO updateCartItem(String cartId, int quantity);
    void removeFromCart(String cartId);
    List<CartDTO> getCartByUserId(String userId);
    CartDTO getCartItemById(String cartId);
    void clearUserCart(String userId);
    boolean existsByUserIdAndCropCode(String userId, String cropCode);
}
