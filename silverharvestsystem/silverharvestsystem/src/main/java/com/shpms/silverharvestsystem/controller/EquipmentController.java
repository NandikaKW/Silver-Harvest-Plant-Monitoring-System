package com.shpms.silverharvestsystem.controller;

import com.shpms.silverharvestsystem.dto.EquipmentDto;
import com.shpms.silverharvestsystem.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("api/v1/equipment")
@RequiredArgsConstructor
@Slf4j
public class EquipmentController {
    private final EquipmentService equipmentService;

    @PostMapping("/save")
    public ResponseEntity<EquipmentDto> saveEquipment(@RequestBody EquipmentDto dto) {
        return ResponseEntity.ok(equipmentService.saveEquipment(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipmentDto> updateEquipment(@PathVariable String id, @RequestBody EquipmentDto dto) {
        return ResponseEntity.ok(equipmentService.updateEquipment(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEquipment(@PathVariable String id) {
        equipmentService.deleteEquipment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipmentDto> getEquipmentById(@PathVariable String id) {
        return ResponseEntity.ok(equipmentService.getEquipmentById(id));
    }

    @GetMapping
    public ResponseEntity<List<EquipmentDto>> getAllEquipments() {
        return ResponseEntity.ok(equipmentService.getAllEquipments());
    }
}
