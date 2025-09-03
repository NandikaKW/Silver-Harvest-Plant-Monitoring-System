package com.shpms.silverharvestsystem.repository;

import com.shpms.silverharvestsystem.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepo extends JpaRepository<Order, String> {
    List<Order> findByUserUserId(String userId);
    List<Order> findByStatus(String status);

    @Query("SELECT o FROM Order o WHERE o.orderDate BETWEEN :startDate AND :endDate")
    List<Order> findOrdersByDateRange(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    @Query("SELECT o FROM Order o WHERE o.totalAmount >= :minAmount")
    List<Order> findOrdersByMinAmount(@Param("minAmount") double minAmount);
    Optional<Order> findTopByOrderByOrderIdDesc();



}
