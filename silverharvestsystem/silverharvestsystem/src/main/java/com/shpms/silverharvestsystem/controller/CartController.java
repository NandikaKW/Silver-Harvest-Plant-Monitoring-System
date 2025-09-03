package com.shpms.silverharvestsystem.controller;

import com.shpms.silverharvestsystem.dto.CartDTO;
import com.shpms.silverharvestsystem.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("api/v1/cart")
@RequiredArgsConstructor
@Slf4j
public class CartController {

    private final CartService cartService;

    @PostMapping
    public ResponseEntity<CartDTO> addToCart(@RequestBody CartDTO cartDTO) {
        try {
            CartDTO savedCart = cartService.addToCart(cartDTO);
            return ResponseEntity.ok(savedCart);
        } catch (Exception e) {
            log.error("Error adding to cart: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{cartId}")
    public ResponseEntity<CartDTO> updateCartItem(
            @PathVariable String cartId,
            @RequestParam int quantity) {
        try {
            CartDTO updatedCart = cartService.updateCartItem(cartId, quantity);
            return ResponseEntity.ok(updatedCart);
        } catch (Exception e) {
            log.error("Error updating cart item: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{cartId}")
    public ResponseEntity<Void> removeFromCart(@PathVariable String cartId) {
        try {
            cartService.removeFromCart(cartId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error removing from cart: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CartDTO>> getCartByUserId(@PathVariable String userId) {
        try {
            List<CartDTO> cartItems = cartService.getCartByUserId(userId);
            return ResponseEntity.ok(cartItems);
        } catch (Exception e) {
            log.error("Error fetching user cart: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{cartId}")
    public ResponseEntity<CartDTO> getCartItemById(@PathVariable String cartId) {
        try {
            CartDTO cartItem = cartService.getCartItemById(cartId);
            return ResponseEntity.ok(cartItem);
        } catch (Exception e) {
            log.error("Error fetching cart item: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> clearUserCart(@PathVariable String userId) {
        try {
            cartService.clearUserCart(userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error clearing user cart: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/exists")
    public ResponseEntity<Boolean> checkItemExists(
            @RequestParam String userId,
            @RequestParam String cropCode) {
        try {
            boolean exists = cartService.existsByUserIdAndCropCode(userId, cropCode);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            log.error("Error checking cart item existence: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

//    Endpoint

}
