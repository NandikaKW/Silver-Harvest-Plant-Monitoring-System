package com.shpms.silverharvestsystem.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "OrderDetail")
public class OrderDetail implements SuperEntity {

    @Id
    private String orderDetailId;

    @ManyToOne
    @JoinColumn(name = "orderId", nullable = false)
    private Order order;

    @ManyToOne
    @JoinColumn(name = "cropCode", nullable = false)
    private Crop crop;

    private int quantity;
    private double price;
}
