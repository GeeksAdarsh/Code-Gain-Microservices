package com.codecampus.repository;

import com.codecampus.model.Submission;
import com.codecampus.model.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByUserId(Long userId);
    List<Submission> findByUserIdAndQuestionId(Long userId, Long questionId);
    List<Submission> findByCodingTestId(Long testId);
    List<Submission> findByUserIdAndCodingTestId(Long userId, Long testId);

    @Query("SELECT s FROM Submission s WHERE s.codingTest.id = :testId ORDER BY s.score DESC, s.submittedAt ASC")
    List<Submission> findLeaderboard(Long testId);

    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, SubmissionStatus status);

    void deleteByCodingTestId(Long testId);
}
