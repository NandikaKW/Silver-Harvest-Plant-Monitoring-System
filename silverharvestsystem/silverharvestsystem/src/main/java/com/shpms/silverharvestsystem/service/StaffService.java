package com.shpms.silverharvestsystem.service;

import com.shpms.silverharvestsystem.dto.StaffDto;

import java.util.List;

public interface StaffService {
    void SaveStaff(StaffDto staffDto);
    StaffDto updateStaff(String staffId, StaffDto staffDto);
    void deleteStaff(String staffId);
    StaffDto getStaffById(String staffId);
    List<StaffDto> getAllStaff();
}
