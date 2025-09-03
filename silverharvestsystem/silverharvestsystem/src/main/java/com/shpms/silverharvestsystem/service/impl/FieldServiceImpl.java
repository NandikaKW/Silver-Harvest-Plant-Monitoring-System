package com.shpms.silverharvestsystem.service.impl;

import com.shpms.silverharvestsystem.dto.FieldDto;
import com.shpms.silverharvestsystem.dto.StaffDto;
import com.shpms.silverharvestsystem.entity.Field;
import com.shpms.silverharvestsystem.entity.Staff;
import com.shpms.silverharvestsystem.exception.DataPersistException;
import com.shpms.silverharvestsystem.repository.FieldRepo;
import com.shpms.silverharvestsystem.repository.MoniteringLogRepo;
import com.shpms.silverharvestsystem.repository.StaffRepo;
import com.shpms.silverharvestsystem.service.FieldService;
import com.shpms.silverharvestsystem.util.Mapping;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FieldServiceImpl implements FieldService {
    private final ModelMapper modelMapper;
    private final FieldRepo fieldRepo;
    private final Mapping mapping;
    private final StaffRepo StaffRepo;
    private final MoniteringLogRepo logRepo;

    @Override
    public void SaveField(FieldDto fieldDto) {
        // Map FieldDto to Field entity
        Field field = mapping.toFieldEntity(fieldDto);

        // Handle Many-to-Many relationship with Staffs
        List<Staff> staffs = new ArrayList<>();
        if (fieldDto.getStaffs() != null) {
            for (StaffDto staffDto : fieldDto.getStaffs()) {
                Staff staff = StaffRepo.findById(staffDto.getStaffId())
                        .orElseThrow(() -> new DataPersistException("Staff not found with ID: " + staffDto.getStaffId()));
                staffs.add(staff);
            }
        }
        field.setStaffs(staffs);

        // Save Field entity
        Field savedField = fieldRepo.save(field);
        if (savedField == null) {
            throw new DataPersistException("Field not saved");
        }
    }

    @Override
    public FieldDto getFieldById(String fieldCode) {
        Field field = fieldRepo.findById(fieldCode)
                .orElseThrow(() -> new RuntimeException("Field not found with code: " + fieldCode));
        return modelMapper.map(field, FieldDto.class);
    }

    @Override
    public List<FieldDto> getAllFields() {
        List<Field> fields = fieldRepo.findAll();
        return fields.stream()
                .map(field -> modelMapper.map(field, FieldDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public void updateField(String fieldCode, FieldDto fieldDto) {
        Field existingField = fieldRepo.findById(fieldCode)
                .orElseThrow(() -> new DataPersistException("Field not found"));

        existingField.setFieldName(fieldDto.getFieldName());
        existingField.setFieldLocation(fieldDto.getFieldLocation());
        existingField.setExtent_size(fieldDto.getExtent_size());
        existingField.setLog(logRepo.findById(fieldDto.getLogCode())
                .orElseThrow(() -> new DataPersistException("Log not found")));

        // Only update images if new ones were uploaded
        if (fieldDto.getFieldImageOne() != null) {
            existingField.setFieldImageOne(fieldDto.getFieldImageOne());
        }
        if (fieldDto.getFieldImageTwo() != null) {
            existingField.setFieldImageTwo(fieldDto.getFieldImageTwo());
        }

        fieldRepo.save(existingField);
    }


    @Override
    public void deleteField(String fieldCode) {
        fieldRepo.deleteById(fieldCode);
    }
}
