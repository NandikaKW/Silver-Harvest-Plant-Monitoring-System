package com.shpms.silverharvestsystem.repository;

import com.shpms.silverharvestsystem.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CropRepo  extends JpaRepository<Crop, String> {
    @Query(value = "SELECT crop_code FROM crop WHERE crop_code LIKE 'C00%' ORDER BY CAST(SUBSTRING(crop_code, 4) AS UNSIGNED) DESC LIMIT 1", nativeQuery = true)
    String findLastCropCode();

    @Query(value = "SELECT crop_code FROM crop", nativeQuery = true)
    List<String> getAllCropIds();

    @Query(value = "SELECT COUNT(*) FROM crop", nativeQuery = true)
    long getCropCount();
}
