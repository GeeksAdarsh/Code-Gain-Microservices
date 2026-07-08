package com.codecampus.repository;

import com.codecampus.model.PlagiarismReport;
import com.codecampus.model.PlagiarismStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlagiarismReportRepository extends JpaRepository<PlagiarismReport, Long> {
    List<PlagiarismReport> findByTestId(Long testId);
    List<PlagiarismReport> findByQuestionId(Long questionId);
    List<PlagiarismReport> findByStatus(PlagiarismStatus status);
    List<PlagiarismReport> findByUser1IdOrUser2Id(Long userId1, Long userId2);
    long countByTestId(Long testId);
    void deleteByTestId(Long testId);
}
