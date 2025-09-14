package com.shpms.silverharvestsystem.controller;

import com.shpms.silverharvestsystem.dto.MoniteringLogDto;
import com.shpms.silverharvestsystem.exception.DataPersistException;
import com.shpms.silverharvestsystem.service.MonitoringLogService;
import com.shpms.silverharvestsystem.util.AppUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("api/v1/logs")
@RequiredArgsConstructor
@Slf4j
public class MonitorLogController {

    private final MonitoringLogService monitoringLogService;


    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('MANAGER')  or hasRole('OTHER')or hasRole('SCIENTIST')")
    public ResponseEntity<Void> saveLogs( @RequestParam("logCode") String logCode,
                                          @RequestParam("logDate") String logDate,
                                          @RequestParam("logDetails") String logDetails,
                                          @RequestParam("observedImage") MultipartFile observedImage ) {
        try {

            String base64ProPic = "";

            byte [] bytesProPic = observedImage.getBytes();
            base64ProPic = AppUtil.ImageToBase64(bytesProPic);



            MoniteringLogDto logDto = new MoniteringLogDto();
            logDto.setLogCode(logCode);
            logDto.setLogDate(logDate);
            logDto.setLogDetails(logDetails);
            logDto.setObservedImage(base64ProPic);




            monitoringLogService.saveLog(logDto);

            return new ResponseEntity<>(HttpStatus.CREATED);
        }catch (DataPersistException e){
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }catch (Exception e){
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('OTHER') or hasRole('SCIENTIST')")
    public ResponseEntity<List<MoniteringLogDto>> getAllLogs() {
        return ResponseEntity.ok(monitoringLogService.getAllLogs());
    }

    @GetMapping("/{logCode}")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('OTHER') or hasRole('SCIENTIST')")
    public ResponseEntity<MoniteringLogDto> getLogById(@PathVariable String logCode) {
        return ResponseEntity.ok(monitoringLogService.getLogById(logCode));
    }
    @PutMapping(value = "/{logID}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('MANAGER')  or hasRole('OTHER')or hasRole('SCIENTIST')")
    public ResponseEntity<Void> updatedLogs(@PathVariable("logID") String logID,
                                            @RequestParam("logDate") String logDate,
                                            @RequestParam("logDetails") String logDetails,
                                            @RequestParam(value = "observedImage", required = false) MultipartFile observedImage) {

        try {
            MoniteringLogDto logDto = new MoniteringLogDto();
            logDto.setLogCode(logID);
            logDto.setLogDate(logDate);
            logDto.setLogDetails(logDetails);

            // Only process image if provided
            if (observedImage != null && !observedImage.isEmpty()) {
                String base64ProPic = "";
                byte[] bytesProPic = observedImage.getBytes();
                base64ProPic = AppUtil.ImageToBase64(bytesProPic);
                logDto.setObservedImage(base64ProPic);
            } else {
                // Keep the existing image - you'll need to handle this in your service
                logDto.setObservedImage(null); // This will need special handling
            }

            // Build the Object
            monitoringLogService.updatedLogs(logID, logDto);
            return new ResponseEntity<>(HttpStatus.CREATED);
        } catch (DataPersistException e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @DeleteMapping("/delete/{logCode}")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('OTHER')or hasRole('SCIENTIST')")
    public ResponseEntity<String> deleteLog(@PathVariable String logCode) {
        monitoringLogService.deleteLog(logCode);
        return ResponseEntity.ok("Monitoring Log deleted successfully");
    }



}
