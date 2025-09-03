package com.shpms.silverharvestsystem.service.impl;

import com.shpms.silverharvestsystem.dto.FieldDto;
import com.shpms.silverharvestsystem.dto.StaffDto;
import com.shpms.silverharvestsystem.entity.*;
import com.shpms.silverharvestsystem.exception.DataPersistException;
import com.shpms.silverharvestsystem.repository.FieldRepo;
import com.shpms.silverharvestsystem.repository.MoniteringLogRepo;
import com.shpms.silverharvestsystem.repository.StaffRepo;
import com.shpms.silverharvestsystem.service.StaffService;
import com.shpms.silverharvestsystem.util.Mapping;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {
    private final StaffRepo staffRepo;
    private final ModelMapper modelMapper;
    private final Mapping mapping;
    private  final FieldRepo fieldRepo;
    private final MoniteringLogRepo moniteringLogRepo;  // add this


    @Override
    public void SaveStaff(StaffDto staffDto) {
        if (staffDto.getStaffId() == null || staffDto.getStaffId().isEmpty()) {
            throw new DataPersistException("Staff ID must be provided (e.g., S001)");
        }

        Staff staff = mapping.toStaffEntity(staffDto);

        // Log mapping
        if (staffDto.getLogCode() != null) {
            MoniteringLog log = moniteringLogRepo.findById(staffDto.getLogCode())
                    .orElseThrow(() -> new DataPersistException("Log not found: " + staffDto.getLogCode()));
            staff.setLog(log);
        } else {
            throw new DataPersistException("Log must be provided");
        }

        // Fields mapping (optional)
        List<Field> fields = new ArrayList<>();
        if (staffDto.getFields() != null) {
            for (FieldDto fieldDto : staffDto.getFields()) {
                Field field = fieldRepo.findById(fieldDto.getFieldCode())
                        .orElseThrow(() -> new DataPersistException("Field not found with ID: " + fieldDto.getFieldCode()));
                fields.add(field);
                if (!field.getStaffs().contains(staff)) {
                    field.getStaffs().add(staff);
                }
            }
        }
        staff.setFields(fields);

        staffRepo.save(staff); // now staffId is provided, Hibernate will persist
    }



    @Override
    public StaffDto updateStaff(String staffId, StaffDto staffDto) {
        Staff existingStaff = staffRepo.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found: " + staffId));

        // Update fields
        existingStaff.setFirstName(staffDto.getFirstName());
        existingStaff.setLastName(staffDto.getLastName());
        existingStaff.setDesignation(staffDto.getDesignation());
        existingStaff.setGender(staffDto.getGender());
        existingStaff.setJoinedDate(staffDto.getJoinedDate());
        existingStaff.setDob(staffDto.getDob());
        existingStaff.setAddress(staffDto.getAddress());
        existingStaff.setContactNo(staffDto.getContactNo());
        existingStaff.setEmail(staffDto.getEmail());
        existingStaff.setRole(staffDto.getRole());
        if (staffDto.getLogCode() != null) {
            MoniteringLog log = moniteringLogRepo.findById(staffDto.getLogCode())
                    .orElseThrow(() -> new RuntimeException("Log not found: " + staffDto.getLogCode()));
            existingStaff.setLog(log);
        }

        Staff updated = staffRepo.save(existingStaff);

        // Map entity back to DTO
        StaffDto updatedDto = new StaffDto();
        updatedDto.setStaffId(updated.getStaffId());
        updatedDto.setFirstName(updated.getFirstName());
        updatedDto.setLastName(updated.getLastName());
        updatedDto.setDesignation(updated.getDesignation());
        updatedDto.setGender(updated.getGender());
        updatedDto.setJoinedDate(updated.getJoinedDate());
        updatedDto.setDob(updated.getDob());
        updatedDto.setAddress(updated.getAddress());
        updatedDto.setContactNo(updated.getContactNo());
        updatedDto.setEmail(updated.getEmail());
        updatedDto.setRole(updated.getRole());
        updatedDto.setLogCode(updated.getLog() != null ? updated.getLog().getLogCode() : null);

        return updatedDto;
    }



    @Override
    public void deleteStaff(String staffId) {
        if (!staffRepo.existsById(staffId)) {
            throw new RuntimeException("Staff not found with id: " + staffId);
        }
        staffRepo.deleteById(staffId);
    }

    @Override
    public StaffDto getStaffById(String staffId) {
        Staff staff = staffRepo.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found with id: " + staffId));
        return modelMapper.map(staff, StaffDto.class);
    }

    @Override
    public List<StaffDto> getAllStaff() {
        return staffRepo.findAll()
                .stream()
                .map(staff -> modelMapper.map(staff, StaffDto.class))
                .collect(Collectors.toList());
    }
}
