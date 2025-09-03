package com.shpms.silverharvestsystem.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "MoniteringLog")
public class MoniteringLog implements SuperEntity{
    @Id
    private String logCode;
    private String logDate;
    private String logDetails;
    @Column(columnDefinition = "LONGTEXT")
    private String observedImage;

    @OneToMany(mappedBy = "log")
    @JsonManagedReference
    private List<Crop> crops;

    @OneToMany(mappedBy = "log")
    @JsonManagedReference
    private List<Staff> staff;

    @OneToMany(mappedBy = "log")
    @JsonManagedReference
    private List<Field> fields;
}
