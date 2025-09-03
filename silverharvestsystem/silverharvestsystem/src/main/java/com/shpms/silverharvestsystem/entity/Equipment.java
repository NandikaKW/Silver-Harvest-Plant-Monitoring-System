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
@Table(name = "Equipment")
public class Equipment implements SuperEntity {
    @Id
    private String equipmentId;
    private String name;
    private String type;
    private String status;

    @ManyToOne
    @JsonBackReference  // Prevent infinite recursion on the staff relationship
    @JoinColumn(name = "StaffId", nullable = false)
    private Staff staff;

    @ManyToOne
    @JsonBackReference  // Prevent infinite recursion on the field relationship
    @JoinColumn(name = "fieldCode", nullable = false)
    private Field fields;
}
