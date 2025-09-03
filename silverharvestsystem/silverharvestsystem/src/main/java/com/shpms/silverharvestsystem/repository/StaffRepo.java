package com.shpms.silverharvestsystem.repository;

import com.shpms.silverharvestsystem.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffRepo extends JpaRepository<Staff, String> {
    @Query(value = "SELECT staff_id FROM staff WHERE staff_id LIKE 'S00%' ORDER BY CAST(SUBSTRING(staff_id, 4) AS UNSIGNED) DESC LIMIT 1", nativeQuery = true)
    String findLastStaffCode();
    @Query(value = "SELECT staff_id FROM staff", nativeQuery = true)
    List<String> getAllIds();

    @Query(value = "SELECT COUNT(*) FROM staff", nativeQuery = true)
    long getCount();
}
