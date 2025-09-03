package com.shpms.silverharvestsystem.service.impl;

import com.shpms.silverharvestsystem.dto.CartDTO;
import com.shpms.silverharvestsystem.entity.Cart;
import com.shpms.silverharvestsystem.entity.Crop;
import com.shpms.silverharvestsystem.entity.User;
import com.shpms.silverharvestsystem.repository.*;
import com.shpms.silverharvestsystem.service.CartService;
import com.shpms.silverharvestsystem.util.AppUtil;
import com.shpms.silverharvestsystem.util.Mapping;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {
    private final CartRepo cartRepo;
    private final CropRepo cropRepo;
    private final UserRepo userRepo;
    private final Mapping mapping;

    @Override
    public CartDTO addToCart(CartDTO cartDTO) {
        Optional<Cart> existingCartItem = cartRepo.findAll().stream()
                .filter(cart -> cart.getUser().getUserId().equals(cartDTO.getUserId()))
                .filter(cart -> cart.getCrop().getCropCode().equals(cartDTO.getCropCode()))
                .findFirst();

        if (existingCartItem.isPresent()) {
            Cart cart = existingCartItem.get();
            cart.setQuantity(cart.getQuantity() + cartDTO.getQuantity());
            Cart updatedCart = cartRepo.save(cart);
            return convertToDTO(updatedCart);
        } else {
            Cart cart = convertToEntity(cartDTO);

            // find last cartId from repo
            String lastId = cartRepo.findTopByOrderByCartIdDesc()
                    .map(Cart::getCartId)
                    .orElse(null);

            // generate next cart code
            cart.setCartId(AppUtil.generateCartCode(lastId));

            Cart savedCart = cartRepo.save(cart);
            return convertToDTO(savedCart);
        }
    }


    @Override
    public CartDTO updateCartItem(String cartId, int quantity) {
        Cart cart = cartRepo.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + cartId));

        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        cart.setQuantity(quantity);
        Cart updatedCart = cartRepo.save(cart);
        return convertToDTO(updatedCart);
    }

    @Override
    public void removeFromCart(String cartId) {
        if (!cartRepo.existsById(cartId)) {
            throw new RuntimeException("Cart item not found with id: " + cartId);
        }
        cartRepo.deleteById(cartId);
    }

    @Override
    public List<CartDTO> getCartByUserId(String userId) {
        List<Cart> cartItems = cartRepo.findAll().stream()
                .filter(cart -> cart.getUser().getUserId().equals(userId))
                .toList();
        return cartItems.stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Override
    public CartDTO getCartItemById(String cartId) {
        Cart cart = cartRepo.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + cartId));
        return convertToDTO(cart);
    }

    @Override
    public void clearUserCart(String userId) {
        List<Cart> userCartItems = cartRepo.findAll().stream()
                .filter(cart -> cart.getUser().getUserId().equals(userId))
                .toList();
        cartRepo.deleteAll(userCartItems);
    }

    @Override
    public boolean existsByUserIdAndCropCode(String userId, String cropCode) {
        return cartRepo.findAll().stream()
                .anyMatch(cart -> cart.getUser().getUserId().equals(userId) &&
                        cart.getCrop().getCropCode().equals(cropCode));
    }

    private Cart convertToEntity(CartDTO cartDTO) {
        Cart cart = new Cart();
        cart.setCartId(cartDTO.getCartId());

        User user = userRepo.findById(cartDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + cartDTO.getUserId()));
        cart.setUser(user);

        Crop crop = cropRepo.findById(cartDTO.getCropCode())
                .orElseThrow(() -> new RuntimeException("Crop not found with code: " + cartDTO.getCropCode()));
        cart.setCrop(crop);

        cart.setQuantity(cartDTO.getQuantity());
        return cart;
    }

    private CartDTO convertToDTO(Cart cart) {
        CartDTO cartDTO = new CartDTO();
        cartDTO.setCartId(cart.getCartId());
        cartDTO.setUserId(cart.getUser().getUserId());
        cartDTO.setCropCode(cart.getCrop().getCropCode());
        cartDTO.setCropName(cart.getCrop().getCommonName()); // Using commonName as cropName
        cartDTO.setQuantity(cart.getQuantity());

        // Set crop image directly (already stored as String/LONGTEXT)
        cartDTO.setCropImage(cart.getCrop().getCropImage());

        return cartDTO;
    }

    private String generateCartId() {
        return "CART_" + UUID.randomUUID().toString().substring(0, 8);
    }
}
