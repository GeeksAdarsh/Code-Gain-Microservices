package com.codecampus.repository;

import com.codecampus.model.CodingTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CodingTestRepository extends JpaRepository<CodingTest, Long> {
    List<CodingTest> findByCreatedById(Long userId);

    List<CodingTest> findByIsPublishedTrue();

    @Query("SELECT t FROM CodingTest t WHERE t.isPublished = true AND t.startTime <= :now AND t.endTime >= :now")
    List<CodingTest> findActiveTests(LocalDateTime now);

    @Query("SELECT t FROM CodingTest t WHERE t.isPublished = true AND t.startTime > :now")
    List<CodingTest> findUpcomingTests(LocalDateTime now);

    @Query("SELECT t FROM CodingTest t WHERE t.isPublished = true AND t.endTime < :now")
    List<CodingTest> findCompletedTests(LocalDateTime now);
}
