package com.shpms.silverharvestsystem.service;

import com.shpms.silverharvestsystem.dto.EquipmentDto;

import java.util.List;

public interface EquipmentService {
    EquipmentDto saveEquipment(EquipmentDto equipmentDto);
    EquipmentDto updateEquipment(String id, EquipmentDto equipmentDto);
    void deleteEquipment(String id);
    EquipmentDto getEquipmentById(String id);
    List<EquipmentDto> getAllEquipments();
}
