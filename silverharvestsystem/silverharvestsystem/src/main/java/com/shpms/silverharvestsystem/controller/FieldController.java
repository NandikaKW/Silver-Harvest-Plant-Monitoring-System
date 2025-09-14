package com.shpms.silverharvestsystem.controller;

import com.shpms.silverharvestsystem.dto.FieldDto;
import com.shpms.silverharvestsystem.exception.DataPersistException;
import com.shpms.silverharvestsystem.service.FieldService;
import com.shpms.silverharvestsystem.util.AppUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.awt.*;
import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("api/v1/field")
@RequiredArgsConstructor
@Slf4j
public class FieldController {

    private final FieldService fieldService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('MANAGER')  or hasRole('SCIENTIST')")
    public ResponseEntity<Void> saveField(
            @RequestParam("fieldCode") String fieldCode,
            @RequestParam("fieldName") String fieldName,
            @RequestParam("fieldLocation") String fieldLocation,
            @RequestParam("extent_size") Double extentSize,
            @RequestParam(value = "fieldImageOne", required = false) MultipartFile fieldImageOne,
            @RequestParam(value = "fieldImageTwo", required = false) MultipartFile fieldImageTwo,
            @RequestParam("logCode") String logCode) {

        try {
            log.info("Received field save request - Code: {}, Name: {}, Location: {}",
                    fieldCode, fieldName, fieldLocation);

            String base64ImageOne = null;
            String base64ImageTwo = null;

            if (fieldImageOne != null && !fieldImageOne.isEmpty()) {
                base64ImageOne = AppUtil.ImageToBase64(fieldImageOne.getBytes());
                log.info("Image 1 processed, size: {}", base64ImageOne != null ? base64ImageOne.length() : 0);
            }
            if (fieldImageTwo != null && !fieldImageTwo.isEmpty()) {
                base64ImageTwo = AppUtil.ImageToBase64(fieldImageTwo.getBytes());
                log.info("Image 2 processed, size: {}", base64ImageTwo != null ? base64ImageTwo.length() : 0);
            }

            FieldDto fieldDto = new FieldDto();
            fieldDto.setFieldCode(fieldCode);
            fieldDto.setFieldName(fieldName);
            fieldDto.setFieldLocation(fieldLocation);
            fieldDto.setExtent_size(extentSize);
            fieldDto.setFieldImageOne(base64ImageOne);
            fieldDto.setFieldImageTwo(base64ImageTwo);
            fieldDto.setLogCode(logCode);

            fieldService.SaveField(fieldDto);
            log.info("Field saved successfully: {}", fieldCode);

            return new ResponseEntity<>(HttpStatus.CREATED);
        } catch (DataPersistException e) {
            log.error("Data persistence error: {}", e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Unexpected error: {}", e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{fieldCode}")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('SCIENTIST')")
    public ResponseEntity<FieldDto> getField(@PathVariable String fieldCode) {
        FieldDto fieldDto = fieldService.getFieldById(fieldCode);
        return ResponseEntity.ok(fieldDto);
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')  or hasRole('SCIENTIST')")
    public ResponseEntity<List<FieldDto>> getAllFields() {
        List<FieldDto> fields = fieldService.getAllFields();
        return ResponseEntity.ok(fields);
    }

    @PutMapping(value = "/{fieldCode}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('MANAGER')  or hasRole('SCIENTIST')")
    public ResponseEntity<Void> updateField(
            @PathVariable String fieldCode, // ✅ This should be @PathVariable, not @RequestParam
            @RequestParam("fieldName") String fieldName,
            @RequestParam("fieldLocation") String fieldLocation,
            @RequestParam("extent_size") Double extentSize,
            @RequestParam(value = "fieldImageOne", required = false) MultipartFile fieldImageOne,
            @RequestParam(value = "fieldImageTwo", required = false) MultipartFile fieldImageTwo,
            @RequestParam("logCode") String logCode) {
        try {
            String base64ImageOne = null;
            String base64ImageTwo = null;

            if (fieldImageOne != null && !fieldImageOne.isEmpty()) {
                base64ImageOne = AppUtil.ImageToBase64(fieldImageOne.getBytes());
            }
            if (fieldImageTwo != null && !fieldImageTwo.isEmpty()) {
                base64ImageTwo = AppUtil.ImageToBase64(fieldImageTwo.getBytes());
            }

            FieldDto updatedFieldDTO = new FieldDto();
            updatedFieldDTO.setFieldCode(fieldCode); // Use the path variable
            updatedFieldDTO.setFieldName(fieldName);
            updatedFieldDTO.setFieldLocation(fieldLocation);
            updatedFieldDTO.setExtent_size(extentSize);
            updatedFieldDTO.setFieldImageOne(base64ImageOne);
            updatedFieldDTO.setFieldImageTwo(base64ImageTwo);
            updatedFieldDTO.setLogCode(logCode);

            fieldService.updateField(fieldCode, updatedFieldDTO);

            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (DataPersistException e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @DeleteMapping("/{fieldCode}")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('SCIENTIST')")
    public ResponseEntity<Void> deleteField(@PathVariable String fieldCode) {
        fieldService.deleteField(fieldCode);
        return ResponseEntity.noContent().build();
    }
}
