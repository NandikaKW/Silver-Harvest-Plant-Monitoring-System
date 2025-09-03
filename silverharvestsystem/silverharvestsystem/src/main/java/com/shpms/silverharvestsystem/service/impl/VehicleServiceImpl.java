package com.shpms.silverharvestsystem.service.impl;

import com.shpms.silverharvestsystem.dto.VehicleDto;
import com.shpms.silverharvestsystem.entity.Staff;
import com.shpms.silverharvestsystem.entity.Vehicle;
import com.shpms.silverharvestsystem.repository.StaffRepo;
import com.shpms.silverharvestsystem.repository.VehicleRepo;
import com.shpms.silverharvestsystem.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {
    private final VehicleRepo vehicleRepo;
    private final ModelMapper modelMapper;
    private final StaffRepo staffRepo;

    @Override
    public List<VehicleDto> getAllVehicles() {
        return vehicleRepo.findAll()
                .stream()
                .map(vehicle -> modelMapper.map(vehicle, VehicleDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public void saveVehicle(VehicleDto vehicleDto) {
        Vehicle vehicle = modelMapper.map(vehicleDto, Vehicle.class);
        vehicleRepo.save(vehicle);
    }

    @Override
    public void updateVehicle(String vehicleCode, VehicleDto vehicleDto) {
        Vehicle existingVehicle = vehicleRepo.findById(vehicleCode)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with code: " + vehicleCode));

        existingVehicle.setLicensePlateNumber(vehicleDto.getLicensePlateNumber());
        existingVehicle.setVehicleCategory(vehicleDto.getVehicleCategory());
        existingVehicle.setFuelType(vehicleDto.getFuelType());
        existingVehicle.setStatus(vehicleDto.getStatus());

        Staff staff = staffRepo.findById(vehicleDto.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found with ID: " + vehicleDto.getStaffId()));
        existingVehicle.setStaff(staff);

        vehicleRepo.save(existingVehicle);
    }

    @Override
    public void deleteVehicle(String vehicleCode) {
        if (vehicleRepo.existsById(vehicleCode)) {
            vehicleRepo.deleteById(vehicleCode);
        } else {
            throw new RuntimeException("Vehicle not found with code: " + vehicleCode);
        }
    }

    @Override
    public VehicleDto getVehicleById(String vehicleCode) {
        return vehicleRepo.findById(vehicleCode)
                .map(vehicle -> modelMapper.map(vehicle, VehicleDto.class))
                .orElseThrow(() -> new RuntimeException("Vehicle not found with code: " + vehicleCode));
    }
}
