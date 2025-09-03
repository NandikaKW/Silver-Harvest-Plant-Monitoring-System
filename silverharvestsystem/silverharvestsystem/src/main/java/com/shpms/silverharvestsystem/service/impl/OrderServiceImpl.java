package com.shpms.silverharvestsystem.service.impl;

import com.shpms.silverharvestsystem.util.OrderMapper;
import com.shpms.silverharvestsystem.dto.OrderDto;
import com.shpms.silverharvestsystem.entity.Crop;
import com.shpms.silverharvestsystem.entity.Order;
import com.shpms.silverharvestsystem.entity.User;
import com.shpms.silverharvestsystem.repository.CropRepo;
import com.shpms.silverharvestsystem.repository.OrderDetailRepo;
import com.shpms.silverharvestsystem.repository.OrderRepo;
import com.shpms.silverharvestsystem.repository.UserRepo;
import com.shpms.silverharvestsystem.service.OrderService;
import com.shpms.silverharvestsystem.util.AppUtil;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final OrderRepo orderRepo;
    private final UserRepo userRepo;
    private final ModelMapper modelMapper;
    private final OrderDetailRepo orderDetailRepo;
    private final CropRepo cropRepo;

    @Override
    public OrderDto createOrder(OrderDto orderDto) {
        // 1. Validate user
        User user = userRepo.findById(orderDto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + orderDto.getUserId()));

        // 2. Fetch crops used in the order
        List<String> cropCodes = orderDto.getOrderDetails().stream()
                .map(d -> d.getCropCode())
                .collect(Collectors.toList());
        List<Crop> crops = cropRepo.findAllById(cropCodes);

        // 3. Get last orderDetailId
        String lastOrderDetailId = orderDetailRepo.findTopByOrderByOrderDetailIdDesc()
                .map(d -> d.getOrderDetailId())
                .orElse(null);

        // 4. Map DTO -> Entity (with generated detail IDs if missing)
        Order order = OrderMapper.toEntity(orderDto, user, crops, lastOrderDetailId);

        // 5. Generate new Order ID
        String lastOrderId = orderRepo.findTopByOrderByOrderIdDesc()
                .map(Order::getOrderId)
                .orElse(null);
        String generatedOrderId = AppUtil.generateOrderId(lastOrderId);
        order.setOrderId(generatedOrderId);

        // 6. Set order date if missing
        if (order.getOrderDate() == null) {
            order.setOrderDate(new Date());
        }

        // 7. Save
        Order savedOrder = orderRepo.save(order);

        // 8. Return DTO
        return OrderMapper.toDto(savedOrder);
    }

    @Override
    public OrderDto getOrderById(String orderId) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        return OrderMapper.toDto(order);
    }

    @Override
    public List<OrderDto> getAllOrders() {
        return orderRepo.findAll().stream()
                .map(OrderMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public OrderDto updateOrder(String orderId, OrderDto orderDto) {
        Order existingOrder = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        existingOrder.setOrderDate(orderDto.getOrderDate());
        existingOrder.setTotalAmount(orderDto.getTotalAmount());
        existingOrder.setStatus(orderDto.getStatus());

        if (!existingOrder.getUser().getUserId().equals(orderDto.getUserId())) {
            User user = userRepo.findById(orderDto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found: " + orderDto.getUserId()));
            existingOrder.setUser(user);
        }

        Order updatedOrder = orderRepo.save(existingOrder);
        return OrderMapper.toDto(updatedOrder);
    }

    @Override
    public void deleteOrder(String orderId) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        orderRepo.delete(order);
    }

    @Override
    public List<OrderDto> getOrdersByUserId(String userId) {
        return orderRepo.findByUserUserId(userId).stream()
                .map(OrderMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderDto> getOrdersByStatus(String status) {
        return orderRepo.findByStatus(status).stream()
                .map(OrderMapper::toDto)
                .collect(Collectors.toList());
    }

}
