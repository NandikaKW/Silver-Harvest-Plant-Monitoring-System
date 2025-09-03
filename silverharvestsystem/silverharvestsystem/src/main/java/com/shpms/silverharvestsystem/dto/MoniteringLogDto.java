package com.shpms.silverharvestsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class MoniteringLogDto implements SuperDTO{
    private String logCode;
    private String logDate;
    private String logDetails;
    private String observedImage;
    private List<CropDTO> cropDtos;
    private List<StaffDto> staffDtos;
    private List<FieldDto> fieldDtos;
}
