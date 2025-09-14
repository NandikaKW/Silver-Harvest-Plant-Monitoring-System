package com.shpms.silverharvestsystem.controller;

import com.shpms.silverharvestsystem.dto.StaffDto;
import com.shpms.silverharvestsystem.exception.DataPersistException;
import com.shpms.silverharvestsystem.service.StaffService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("api/v1/staff")
@RequiredArgsConstructor
@Slf4j
public class StaffController {
    private final StaffService staffService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('MANAGER')  or hasRole('ADMINISTRATIVE')")
    public ResponseEntity<Void> saveStaff(@RequestBody StaffDto staffDto) {
        try {

            staffService.SaveStaff(staffDto);
            return new ResponseEntity<>(HttpStatus.CREATED);
        }catch (DataPersistException e){
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

        }catch (Exception e){
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('ADMINISTRATIVE')")
    public ResponseEntity<StaffDto> updateStaff(
            @PathVariable("id") String staffId,
            @RequestBody StaffDto staffDto) {
        return ResponseEntity.ok(staffService.updateStaff(staffId, staffDto));
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('ADMINISTRATIVE')")
    public ResponseEntity<Void> deleteStaff(@PathVariable("id") String staffId) {
        staffService.deleteStaff(staffId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('ADMINISTRATIVE')")
    public ResponseEntity<StaffDto> getStaff(@PathVariable("id") String staffId) {
        return ResponseEntity.ok(staffService.getStaffById(staffId));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('MANAGER')  or hasRole('ADMINISTRATIVE')")
    public ResponseEntity<List<StaffDto>> getAllStaff() {
        return ResponseEntity.ok(staffService.getAllStaff());
    }

}
