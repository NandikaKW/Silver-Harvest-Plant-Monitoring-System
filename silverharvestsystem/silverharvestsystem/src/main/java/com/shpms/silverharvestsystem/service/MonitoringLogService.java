package com.shpms.silverharvestsystem.service;

import com.shpms.silverharvestsystem.dto.MoniteringLogDto;

import java.util.List;

public interface MonitoringLogService {
    List<MoniteringLogDto> getAllLogs();
    MoniteringLogDto getLogById(String logCode);
    void deleteLog(String logCode);
    void saveLog(MoniteringLogDto logDto);
    void updatedLogs(String logID, MoniteringLogDto logDto);
}
