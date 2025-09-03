package com.shpms.silverharvestsystem.service;

import com.shpms.silverharvestsystem.dto.OrderDto;

import java.util.List;

public interface OrderService {
    OrderDto createOrder(OrderDto orderDto);
    OrderDto getOrderById(String orderId);
    List<OrderDto> getAllOrders();
    OrderDto updateOrder(String orderId, OrderDto orderDto);
    void deleteOrder(String orderId);
    List<OrderDto> getOrdersByUserId(String userId);
    List<OrderDto> getOrdersByStatus(String status);

}
