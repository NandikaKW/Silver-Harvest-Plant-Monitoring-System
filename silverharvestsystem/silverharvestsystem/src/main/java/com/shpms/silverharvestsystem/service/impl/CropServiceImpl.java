package com.shpms.silverharvestsystem.service.impl;

import com.shpms.silverharvestsystem.dto.CropDTO;
import com.shpms.silverharvestsystem.entity.Crop;
import com.shpms.silverharvestsystem.entity.Field;
import com.shpms.silverharvestsystem.entity.MoniteringLog;
import com.shpms.silverharvestsystem.exception.DataPersistException;
import com.shpms.silverharvestsystem.repository.CropRepo;
import com.shpms.silverharvestsystem.repository.FieldRepo;
import com.shpms.silverharvestsystem.repository.MoniteringLogRepo;
import com.shpms.silverharvestsystem.service.CropService;
import com.shpms.silverharvestsystem.util.Mapping;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.crossstore.ChangeSetPersister;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CropServiceImpl implements CropService {
    private final CropRepo cropRepo;
    private final FieldRepo fieldRepo;
    private final MoniteringLogRepo logRepo;
    private final ModelMapper modelMapper;
    private final Mapping noteMapping; // Mapper to convert between DTO and Entity

    @Override
    public List<CropDTO> getAllCrops() {
        return cropRepo.findAll()
                .stream()
                .map(crop -> {
                    CropDTO dto = modelMapper.map(crop, CropDTO.class);
                    dto.setFieldCode(crop.getField().getFieldCode());
                    dto.setLogCode(crop.getLog().getLogCode());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public CropDTO getCropById(String cropCode) {
        Crop crop = cropRepo.findById(cropCode)
                .orElseThrow(() -> new RuntimeException("Crop not found"));

        CropDTO dto = modelMapper.map(crop, CropDTO.class);
        dto.setFieldCode(crop.getField().getFieldCode());
        dto.setLogCode(crop.getLog().getLogCode());
        return dto;
    }

    @Override
    public CropDTO saveCrop(CropDTO cropDto) {

        Field field = fieldRepo.findById(cropDto.getFieldCode())
                .orElseThrow(() -> new DataPersistException("Field not found"));

        MoniteringLog log = logRepo.findById(cropDto.getLogCode())
                .orElseThrow(() -> new DataPersistException("Log not found"));


        Crop cropEntity = noteMapping.toCropEntity(cropDto);
        cropEntity.setField(field);
        cropEntity.setLog(log);


        Crop savedCrop = cropRepo.save(cropEntity);
        if (savedCrop == null) {
            throw new DataPersistException("CROP not saved");
        }

        return noteMapping.toCropDTO(savedCrop);
    }


    @Override
    public void updateCrop(String cropId, CropDTO cropDto) {
        Crop crop = cropRepo.findById(cropId)
                .orElseThrow(() -> new DataPersistException("Crop not found"));

        crop.setCategory(cropDto.getCategory());
        crop.setCommonName(cropDto.getCommonName());
        crop.setScientificName(cropDto.getScientificName());
        crop.setCropSeason(cropDto.getCropSeason());

        // only update image
        if (cropDto.getCropImage() != null) {
            crop.setCropImage(cropDto.getCropImage());
        }

        // ⚠️ because your entity
        if (cropDto.getFieldCode() != null) {
            Field field = new Field();
            field.setFieldCode(cropDto.getFieldCode());
            crop.setField(field);
        }
        if (cropDto.getLogCode() != null) {
            MoniteringLog log = new MoniteringLog();
            log.setLogCode(cropDto.getLogCode());
            crop.setLog(log);
        }

        cropRepo.save(crop);
    }


    @Override
    public void deleteCrop(String cropCode) {
        if (!cropRepo.existsById(cropCode)) {
            throw new RuntimeException("Crop not found");
        }
        cropRepo.deleteById(cropCode);
    }
}
