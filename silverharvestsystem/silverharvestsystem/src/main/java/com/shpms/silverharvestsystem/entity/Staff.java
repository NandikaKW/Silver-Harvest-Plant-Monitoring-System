package com.shpms.silverharvestsystem.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.shpms.silverharvestsystem.Enum.Gender;
import com.shpms.silverharvestsystem.Enum.Role;
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
@Table(name = "Staff")
public class Staff implements SuperEntity {
    @Id
    private String staffId;
    private String firstName;
    private String lastName;
    private String designation;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private Date joinedDate;
    private Date dob;
    private String address;

    @Column(name = "contact_no")
    private String contactNo;

    private String email;

    @OneToMany(mappedBy = "staff",cascade = CascadeType.REMOVE)
    @JsonManagedReference  // Serialize the vehicles for the staff
    private List<Vehicle> vehicles;

    private Role role;

    @OneToMany(mappedBy = "staff",cascade = CascadeType.REMOVE)
    @JsonManagedReference  // Serialize the equipment for the staff
    private List<Equipment> equipment;

    /*@ManyToMany(mappedBy = "staffs", cascade = {CascadeType.PERSIST})*/
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "Field_Staff",
            joinColumns = @JoinColumn(name = "staffId"),
            inverseJoinColumns = @JoinColumn(name = "fieldCode")
    )
    private List<Field> fields;

    @ManyToOne
    @JsonBackReference  // Prevent infinite recursion on the log relationship
    @JoinColumn(name = "logCode", nullable = false)
    private MoniteringLog log;

    public String getContactNo() {
        return contactNo;
    }

    public void setContactNo(String contactNo) {
        this.contactNo = contactNo;
    }
}
