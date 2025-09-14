package com.shpms.silverharvestsystem.controller;

import com.shpms.silverharvestsystem.dto.VehicleDto;
import com.shpms.silverharvestsystem.service.VehicleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("api/v1/vehicle")
@RequiredArgsConstructor
@Slf4j
public class VehicleController {
    private final VehicleService vehicleService;

    @PostMapping("/save")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('ADMINISTRATIVE') or hasRole('OTHER')")
    public ResponseEntity<String> saveVehicle(@RequestBody VehicleDto vehicleDTO) {
        vehicleService.saveVehicle(vehicleDTO);
        return ResponseEntity.ok("Vehicle saved successfully");
    }

    @GetMapping("/getAll")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('ADMINISTRATIVE') or hasRole('OTHER')")
    public ResponseEntity<List<VehicleDto>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{vehicleCode}")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('ADMINISTRATIVE') or hasRole('OTHER')")
    public ResponseEntity<VehicleDto> getVehicleById(@PathVariable String vehicleCode) {
        return ResponseEntity.ok(vehicleService.getVehicleById(vehicleCode));
    }

    @PutMapping("/update/{vehicleCode}")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('ADMINISTRATIVE') or hasRole('OTHER')")
    public ResponseEntity<String> updateVehicle(@PathVariable String vehicleCode,
                                                @RequestBody VehicleDto vehicleDTO) {
        vehicleService.updateVehicle(vehicleCode, vehicleDTO);
        return ResponseEntity.ok("Vehicle updated successfully");
    }

    @DeleteMapping("/delete/{vehicleCode}")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('ADMINISTRATIVE') or hasRole('OTHER')")
    public ResponseEntity<String> deleteVehicle(@PathVariable String vehicleCode) {
        vehicleService.deleteVehicle(vehicleCode);
        return ResponseEntity.ok("Vehicle deleted successfully");
    }
}
