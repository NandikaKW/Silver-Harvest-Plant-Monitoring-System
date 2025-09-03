package com.shpms.silverharvestsystem.service;

import com.shpms.silverharvestsystem.dto.CropDTO;

import java.util.List;

public interface CropService {
    List<CropDTO> getAllCrops();
    CropDTO getCropById(String cropCode);
    CropDTO saveCrop(CropDTO cropDto);
    void updateCrop(String CropId, CropDTO cropDto);
    void deleteCrop(String cropCode);
}
