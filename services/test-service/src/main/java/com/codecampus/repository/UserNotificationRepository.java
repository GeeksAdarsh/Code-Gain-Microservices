package com.codecampus.repository;

import com.codecampus.model.UserNotification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
    List<UserNotification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndReadFalse(Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update UserNotification n set n.read = true where n.user.id = :userId and n.read = false")
    int markAllReadForUser(@Param("userId") Long userId);
}
