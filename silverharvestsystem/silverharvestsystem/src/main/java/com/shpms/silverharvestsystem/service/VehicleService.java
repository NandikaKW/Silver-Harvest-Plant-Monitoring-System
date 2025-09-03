package com.shpms.silverharvestsystem.service;

import com.shpms.silverharvestsystem.dto.VehicleDto;

import java.util.List;

public interface VehicleService {
    List<VehicleDto> getAllVehicles();
    void saveVehicle(VehicleDto vehicle);
    void updateVehicle(String vehicleCode, VehicleDto vehicle);
    void deleteVehicle(String vehicleCode);
    VehicleDto getVehicleById(String vehicleCode);
}
