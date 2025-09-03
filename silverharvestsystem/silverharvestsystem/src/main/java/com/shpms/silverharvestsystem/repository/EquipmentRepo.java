package com.shpms.silverharvestsystem.repository;

import com.shpms.silverharvestsystem.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EquipmentRepo extends JpaRepository<Equipment, String> {

}
