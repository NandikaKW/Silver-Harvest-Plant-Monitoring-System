package com.shpms.silverharvestsystem.service;

import com.shpms.silverharvestsystem.dto.FieldDto;

import java.util.List;

public interface FieldService {
    void SaveField(FieldDto fieldDto);
    FieldDto getFieldById(String fieldCode);
    List<FieldDto> getAllFields();
    void updateField(String fieldId, FieldDto fieldDto);
    void deleteField(String fieldCode);
}
