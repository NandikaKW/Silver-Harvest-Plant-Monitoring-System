package com.shpms.silverharvestsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.Date;
import java.util.List;
@AllArgsConstructor
@NoArgsConstructor
@Data
@ToString
public class OrderDto {
    private String orderId;
    private String userId;   // Reference to User instead of full User entity
    private Date orderDate;
    private double totalAmount;
    private String status;   // PENDING, COMPLETED, CANCELLED
    private List<OrderDetailDto> orderDetails; // Reference to DTO list
}
