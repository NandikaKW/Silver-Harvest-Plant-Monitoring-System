package com.shpms.silverharvestsystem.service.impl;

import com.shpms.silverharvestsystem.dto.OrderDetailDto;
import com.shpms.silverharvestsystem.entity.Crop;
import com.shpms.silverharvestsystem.entity.Order;
import com.shpms.silverharvestsystem.entity.OrderDetail;
import com.shpms.silverharvestsystem.repository.CropRepo;
import com.shpms.silverharvestsystem.repository.OrderDetailRepo;
import com.shpms.silverharvestsystem.repository.OrderRepo;
import com.shpms.silverharvestsystem.service.OrderdetailService;
import com.shpms.silverharvestsystem.util.AppUtil;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderdetailServiceImpl implements OrderdetailService {
    private final OrderDetailRepo orderDetailRepo;
    private final OrderRepo orderRepo;
    private final CropRepo cropRepo;
    private final ModelMapper modelMapper;

    @Override
    public OrderDetailDto createOrderDetail(OrderDetailDto dto) {
        // Generate next ID
        String lastId = orderDetailRepo.findTopByOrderByOrderDetailIdDesc()
                .map(OrderDetail::getOrderDetailId)
                .orElse(null);

        String newId = AppUtil.generateOrderDetailId(lastId);
        dto.setOrderDetailId(newId);

        // Load references
        Order order = orderRepo.findById(dto.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found: " + dto.getOrderId()));
        Crop crop = cropRepo.findById(dto.getCropCode())
                .orElseThrow(() -> new RuntimeException("Crop not found: " + dto.getCropCode()));

        // Map DTO to Entity
        OrderDetail entity = new OrderDetail();
        entity.setOrderDetailId(dto.getOrderDetailId());
        entity.setOrder(order);
        entity.setCrop(crop);
        entity.setQuantity(dto.getQuantity());
        entity.setPrice(dto.getPrice());

        // Save
        orderDetailRepo.save(entity);

        return dto;
    }

    @Override
    public List<OrderDetailDto> getAllOrderDetails() {
        return orderDetailRepo.findAll()
                .stream()
                .map(orderDetail -> {
                    OrderDetailDto dto = new OrderDetailDto();
                    dto.setOrderDetailId(orderDetail.getOrderDetailId());
                    dto.setOrderId(orderDetail.getOrder().getOrderId());
                    dto.setCropCode(orderDetail.getCrop().getCropCode());
                    dto.setQuantity(orderDetail.getQuantity());
                    dto.setPrice(orderDetail.getPrice());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public Optional<OrderDetailDto> getOrderDetailById(String id) {
        return orderDetailRepo.findById(id)
                .map(orderDetail -> new OrderDetailDto(
                        orderDetail.getOrderDetailId(),
                        orderDetail.getOrder().getOrderId(),
                        orderDetail.getCrop().getCropCode(),
                        orderDetail.getQuantity(),
                        orderDetail.getPrice()
                ));
    }
}
