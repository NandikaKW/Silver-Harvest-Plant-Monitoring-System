package com.shpms.silverharvestsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@Data
@ToString
public class OrderDetailDto {
    private String orderDetailId;
    private String orderId;   // reference instead of full Order entity
    private String cropCode;  // reference instead of full Crop entity
    private int quantity;
    private double price;
}
