package com.shpms.silverharvestsystem.util;

import com.shpms.silverharvestsystem.dto.OrderDetailDto;
import com.shpms.silverharvestsystem.dto.OrderDto;
import com.shpms.silverharvestsystem.entity.Crop;
import com.shpms.silverharvestsystem.entity.Order;
import com.shpms.silverharvestsystem.entity.OrderDetail;
import com.shpms.silverharvestsystem.entity.User;

import java.util.List;
import java.util.stream.Collectors;

public class OrderMapper {
    // Entity -> DTO
    public static OrderDto toDto(Order order) {
        OrderDto dto = new OrderDto();
        dto.setOrderId(order.getOrderId());
        dto.setUserId(order.getUser().getUserId()); // Extract userId
        dto.setOrderDate(order.getOrderDate());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus());

        if (order.getOrderDetails() != null) {
            List<OrderDetailDto> detailDtos = order.getOrderDetails().stream().map(detail -> {
                OrderDetailDto d = new OrderDetailDto();
                d.setOrderDetailId(detail.getOrderDetailId());
                d.setOrderId(order.getOrderId()); // reference only
                d.setCropCode(detail.getCrop().getCropCode()); // reference only
                d.setQuantity(detail.getQuantity());
                d.setPrice(detail.getPrice());
                return d;
            }).collect(Collectors.toList());
            dto.setOrderDetails(detailDtos);
        }

        return dto;
    }

    public static Order toEntity(OrderDto dto, User user, List<Crop> crops, String lastOrderDetailId) {
        Order order = new Order();
        order.setOrderId(dto.getOrderId());
        order.setUser(user);
        order.setOrderDate(dto.getOrderDate());
        order.setTotalAmount(dto.getTotalAmount());
        order.setStatus(dto.getStatus());

        if (dto.getOrderDetails() != null) {
            List<OrderDetail> details = dto.getOrderDetails().stream().map(detailDto -> {
                OrderDetail detail = new OrderDetail();

                // ✅ Fix: generate ID if null
                if (detailDto.getOrderDetailId() == null || detailDto.getOrderDetailId().isEmpty()) {
                    detail.setOrderDetailId(AppUtil.generateOrderDetailId(lastOrderDetailId));
                } else {
                    detail.setOrderDetailId(detailDto.getOrderDetailId());
                }

                detail.setOrder(order); // back reference

                // Find crop by cropCode
                Crop crop = crops.stream()
                        .filter(c -> c.getCropCode().equals(detailDto.getCropCode()))
                        .findFirst()
                        .orElse(null);
                detail.setCrop(crop);

                detail.setQuantity(detailDto.getQuantity());
                detail.setPrice(detailDto.getPrice());
                return detail;
            }).collect(Collectors.toList());
            order.setOrderDetails(details);
        }

        return order;
    }

}
