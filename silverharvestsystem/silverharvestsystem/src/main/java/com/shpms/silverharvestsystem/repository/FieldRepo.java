package com.shpms.silverharvestsystem.repository;

import com.shpms.silverharvestsystem.entity.Field;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FieldRepo extends JpaRepository<Field, String> {
}
