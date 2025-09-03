package com.shpms.silverharvestsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class EquipmentDto implements SuperDTO{
    private String equipmentId;
    private String name;
    private String type;
    private String status;
    private String StaffId;
    private String fieldCode;
}
