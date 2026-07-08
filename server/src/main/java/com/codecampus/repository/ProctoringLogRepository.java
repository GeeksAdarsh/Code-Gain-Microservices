package com.codecampus.repository;

import com.codecampus.model.ProctoringEventType;
import com.codecampus.model.ProctoringLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProctoringLogRepository extends JpaRepository<ProctoringLog, Long> {
    List<ProctoringLog> findByUserIdAndCodingTestId(Long userId, Long testId);
    List<ProctoringLog> findByCodingTestId(Long testId);
    List<ProctoringLog> findByFlaggedTrue();

    @Query("SELECT p FROM ProctoringLog p WHERE p.codingTest.id = :testId AND p.flagged = true")
    List<ProctoringLog> findFlaggedByTestId(@Param("testId") Long testId);

    @Query("SELECT COUNT(p) FROM ProctoringLog p WHERE p.user.id = :userId AND p.codingTest.id = :testId AND p.eventType = :type")
    int countByEventType(@Param("userId") Long userId, @Param("testId") Long testId, @Param("type") ProctoringEventType type);

    default int countTabSwitches(Long userId, Long testId) {
        return countByEventType(userId, testId, ProctoringEventType.TAB_SWITCH);
    }

    void deleteByCodingTestId(Long testId);
}
