package com.shpms.silverharvestsystem.repository;

import com.shpms.silverharvestsystem.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepo extends JpaRepository<Cart, String> {
    @Query("SELECT c FROM Cart c WHERE c.user.userId = :userId")
    List<Cart> findByUserId(@Param("userId") String userId);

    @Query("SELECT c FROM Cart c WHERE c.user.userId = :userId AND c.crop.cropCode = :cropCode")
    Optional<Cart> findByUserIdAndCropCode(@Param("userId") String userId, @Param("cropCode") String cropCode);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Cart c WHERE c.user.userId = :userId AND c.crop.cropCode = :cropCode")
    boolean existsByUserIdAndCropCode(@Param("userId") String userId, @Param("cropCode") String cropCode);
    void deleteByUserUserId(String userId);
    Optional<Cart> findTopByOrderByCartIdDesc();
}
