package com.shpms.silverharvestsystem.service.impl;

import com.shpms.silverharvestsystem.dto.EquipmentDto;
import com.shpms.silverharvestsystem.entity.Equipment;
import com.shpms.silverharvestsystem.entity.Field;
import com.shpms.silverharvestsystem.entity.Staff;
import com.shpms.silverharvestsystem.repository.EquipmentRepo;
import com.shpms.silverharvestsystem.repository.FieldRepo;
import com.shpms.silverharvestsystem.repository.StaffRepo;
import com.shpms.silverharvestsystem.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EquipmentServiceImpl implements EquipmentService {
    private final EquipmentRepo equipmentRepo;
    private final StaffRepo staffRepo;
    private final FieldRepo fieldRepo;
    private final ModelMapper modelMapper;

    @Override
    public EquipmentDto saveEquipment(EquipmentDto equipmentDto) {
        Equipment equipment = modelMapper.map(equipmentDto, Equipment.class);

        // set relations manually
        Staff staff = staffRepo.findById(equipmentDto.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        Field field = fieldRepo.findById(equipmentDto.getFieldCode())
                .orElseThrow(() -> new RuntimeException("Field not found"));

        equipment.setStaff(staff);
        equipment.setFields(field);

        Equipment saved = equipmentRepo.save(equipment);
        return modelMapper.map(saved, EquipmentDto.class);
    }

    @Override
    public EquipmentDto updateEquipment(String id, EquipmentDto equipmentDto) {
        Equipment existing = equipmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));

        existing.setName(equipmentDto.getName());
        existing.setType(equipmentDto.getType());
        existing.setStatus(equipmentDto.getStatus());

        Staff staff = staffRepo.findById(equipmentDto.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        Field field = fieldRepo.findById(equipmentDto.getFieldCode())
                .orElseThrow(() -> new RuntimeException("Field not found"));

        existing.setStaff(staff);
        existing.setFields(field);

        Equipment updated = equipmentRepo.save(existing);
        return modelMapper.map(updated, EquipmentDto.class);
    }

    @Override
    public void deleteEquipment(String id) {
        equipmentRepo.deleteById(id);
    }

    @Override
    public EquipmentDto getEquipmentById(String id) {
        Equipment equipment = equipmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));

        EquipmentDto dto = new EquipmentDto();
        dto.setEquipmentId(equipment.getEquipmentId());
        dto.setName(equipment.getName());
        dto.setType(equipment.getType());
        dto.setStatus(equipment.getStatus());


        if (equipment.getStaff() != null) {
            dto.setStaffId(equipment.getStaff().getStaffId());
        }
        if (equipment.getFields() != null) {
            dto.setFieldCode(equipment.getFields().getFieldCode());
        }

        return dto;
    }

    @Override
    public List<EquipmentDto> getAllEquipments() {
        return equipmentRepo.findAll().stream().map(equipment -> {
            EquipmentDto dto = new EquipmentDto();
            dto.setEquipmentId(equipment.getEquipmentId());
            dto.setName(equipment.getName());
            dto.setType(equipment.getType());
            dto.setStatus(equipment.getStatus());

            if (equipment.getStaff() != null) {
                dto.setStaffId(equipment.getStaff().getStaffId());
            }
            if (equipment.getFields() != null) {
                dto.setFieldCode(equipment.getFields().getFieldCode());
            }

            return dto;
        }).collect(Collectors.toList());
    }
}
