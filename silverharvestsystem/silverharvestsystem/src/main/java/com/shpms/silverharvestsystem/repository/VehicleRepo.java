package com.shpms.silverharvestsystem.repository;

import com.shpms.silverharvestsystem.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleRepo extends JpaRepository<Vehicle, String> {
}
