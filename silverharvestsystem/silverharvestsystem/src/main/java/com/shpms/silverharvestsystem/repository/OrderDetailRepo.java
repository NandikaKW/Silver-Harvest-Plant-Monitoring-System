package com.shpms.silverharvestsystem.repository;

import com.shpms.silverharvestsystem.entity.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderDetailRepo extends JpaRepository<OrderDetail, String> {
    Optional<OrderDetail> findTopByOrderByOrderDetailIdDesc();
}
