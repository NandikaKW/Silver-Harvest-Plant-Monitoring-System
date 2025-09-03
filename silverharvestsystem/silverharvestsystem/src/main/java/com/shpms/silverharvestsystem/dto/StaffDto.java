package com.shpms.silverharvestsystem.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.shpms.silverharvestsystem.Enum.Gender;
import com.shpms.silverharvestsystem.Enum.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.Date;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@ToString
public class StaffDto implements SuperDTO{
    private String staffId;
    private String firstName;
    private String lastName;
    private String designation;
    private Gender gender;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private Date dob;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private Date joinedDate;

    private String address;
    private String contactNo;
    private String email;
    private Role role;

    private List<VehicleDto> vehicleDtos;
    private List<EquipmentDto> equipmentDtos;
    private List<FieldDto> fields;

    private String logCode;
}
