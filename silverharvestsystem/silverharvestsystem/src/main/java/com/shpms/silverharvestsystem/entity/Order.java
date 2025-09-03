package com.shpms.silverharvestsystem.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "Orders")
public class Order implements SuperEntity {

    @Id
    private String orderId;

    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    private Date orderDate;
    private double totalAmount;
    private String status; // PENDING, COMPLETED, CANCELLED

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderDetail> orderDetails;
}
