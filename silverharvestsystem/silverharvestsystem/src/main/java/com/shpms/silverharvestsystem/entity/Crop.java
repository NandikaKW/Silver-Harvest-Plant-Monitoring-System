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
@Table(name = "Crop")
public class Crop implements SuperEntity{
    @Id
    private String cropCode;
    private String commonName;
    private String scientificName;
    @Column(columnDefinition = "LONGTEXT")
    private String cropImage;
    private String category;
    private String cropSeason;

    @ManyToOne
    @JsonBackReference
    @JoinColumn(name = "fieldCode", nullable = false)
    private Field field;

    @ManyToOne
    @JsonBackReference
    @JoinColumn(name = "logCode", nullable = false)
    private MoniteringLog log;
}
