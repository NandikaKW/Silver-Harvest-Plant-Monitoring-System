package com.shpms.silverharvestsystem.service;

import com.shpms.silverharvestsystem.dto.OrderDetailDto;

import java.util.List;
import java.util.Optional;

public interface OrderdetailService {
    OrderDetailDto createOrderDetail(OrderDetailDto dto);
    List<OrderDetailDto> getAllOrderDetails();
    Optional<OrderDetailDto> getOrderDetailById(String id);
}
