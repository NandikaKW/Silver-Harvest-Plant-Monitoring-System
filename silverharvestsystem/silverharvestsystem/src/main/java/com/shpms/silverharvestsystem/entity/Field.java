package com.shpms.silverharvestsystem.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.awt.*;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "Field")
public class Field implements SuperEntity{
    @Id
    private String fieldCode;
    private String fieldName;
    @Column(name = "field_location")
    private String fieldLocation;
    private Double extent_size;
    @Column(columnDefinition = "LONGTEXT")
    private String fieldImageOne;
    @Column(columnDefinition = "LONGTEXT")
    private String fieldImageTwo;

    @OneToMany(mappedBy = "field",cascade = CascadeType.REMOVE)
    @JsonManagedReference  // Serialize the crops in the field
    private java.util.List<Crop> crops;

    @OneToMany(mappedBy = "fields",cascade = CascadeType.REMOVE)
    @JsonManagedReference  // Serialize the equipments in the field
    private java.util.List<Equipment> equipments;


    @ManyToMany(mappedBy = "fields", cascade = {CascadeType.MERGE,}, fetch = FetchType.EAGER)
    private List<Staff> staffs;

    @ManyToOne
    @JoinColumn(name = "logCode", nullable = false)
    private MoniteringLog log;
}
