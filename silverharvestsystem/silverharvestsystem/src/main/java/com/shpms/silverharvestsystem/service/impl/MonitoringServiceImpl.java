package com.shpms.silverharvestsystem.service.impl;

import com.shpms.silverharvestsystem.dto.MoniteringLogDto;
import com.shpms.silverharvestsystem.entity.MoniteringLog;
import com.shpms.silverharvestsystem.exception.DataPersistException;
import com.shpms.silverharvestsystem.repository.MoniteringLogRepo;
import com.shpms.silverharvestsystem.service.MonitoringLogService;
import com.shpms.silverharvestsystem.util.Mapping;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MonitoringServiceImpl implements MonitoringLogService {
    private final MoniteringLogRepo logRepo;
    private final ModelMapper modelMapper;
    private final Mapping logsMapping;


    @Override
    public List<MoniteringLogDto> getAllLogs() {
        return logRepo.findAll()
                .stream()
                .map(log -> modelMapper.map(log, MoniteringLogDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public MoniteringLogDto getLogById(String logCode) {
        return logRepo.findById(logCode)
                .map(log -> modelMapper.map(log, MoniteringLogDto.class))
                .orElseThrow(() -> new RuntimeException("Log not found with ID: " + logCode));
    }



    @Override
    public void deleteLog(String logCode) {
        if (!logRepo.existsById(logCode)) {
            throw new RuntimeException("Log not found with ID: " + logCode);
        }
        logRepo.deleteById(logCode);
    }

    @Override
    public void saveLog(MoniteringLogDto logDto) {
        String logCode = logDto.getLogCode();
        MoniteringLog savedLogs =
                logRepo.save(logsMapping.toMoniteringLogEntity(logDto));
        if(savedLogs == null){
            throw new DataPersistException("Logs not saved");
        }
    }

    @Override
    public void updatedLogs(String logID, MoniteringLogDto logDto) {
        Optional<MoniteringLog> foundLogs = logRepo.findById(logID);
        if (!foundLogs.isPresent()) {
            throw new DataPersistException("Logs not found");
        } else {
            MoniteringLog log = foundLogs.get();
            log.setLogDate(logDto.getLogDate());
            log.setLogDetails(logDto.getLogDetails());

            // Only update image if a new one was provided
            if (logDto.getObservedImage() != null) {
                log.setObservedImage(logDto.getObservedImage());
            }
            // If no new image, keep the existing one

            // Save back to DB
            logRepo.save(log);
        }
    }
}
