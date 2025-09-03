package com.shpms.silverharvestsystem.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "Vehicle")
public class Vehicle implements SuperEntity{
    @Id
    private String vehicleCode;
    private String licensePlateNumber;
    private String vehicleCategory;
    private String fuelType;
    private String status;

    @ManyToOne
    @JsonBackReference
    @JoinColumn(name = "StaffId", nullable = false)
    private Staff staff;
}
