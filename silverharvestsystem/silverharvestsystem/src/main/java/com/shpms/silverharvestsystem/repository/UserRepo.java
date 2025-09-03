package com.shpms.silverharvestsystem.repository;

import com.shpms.silverharvestsystem.dto.UserDto;
import com.shpms.silverharvestsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User, String> {
    User findByEmail(String email);
    boolean existsByEmail(String email);
}
