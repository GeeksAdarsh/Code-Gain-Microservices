package com.codecampus.repository;

import com.codecampus.model.ProctoringLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProctoringLogRepository extends JpaRepository<ProctoringLog, Long> {
    List<ProctoringLog> findByUserIdAndTestId(Long userId, Long testId);
    List<ProctoringLog> findByTestId(Long testId);
    List<ProctoringLog> findByFlaggedTrue();

    @Query("SELECT p FROM ProctoringLog p WHERE p.testId = :testId AND p.flagged = true")
    List<ProctoringLog> findFlaggedByTestId(Long testId);

    @Query("SELECT COUNT(p) FROM ProctoringLog p WHERE p.user.id = :userId AND p.testId = :testId AND p.eventType = 'TAB_SWITCH'")
    int countTabSwitches(Long userId, Long testId);

    void deleteByTestId(Long testId);
}
