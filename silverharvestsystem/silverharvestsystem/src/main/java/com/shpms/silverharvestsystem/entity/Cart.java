package com.shpms.silverharvestsystem.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "Cart")
public class Cart implements SuperEntity {

    @Id
    private String cartId;

    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "cropCode", nullable = false)
    private Crop crop;

    private int quantity;
}

