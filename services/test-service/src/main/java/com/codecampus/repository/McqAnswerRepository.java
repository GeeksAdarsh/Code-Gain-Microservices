package com.codecampus.repository;

import com.codecampus.model.McqAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface McqAnswerRepository extends JpaRepository<McqAnswer, Long> {
    List<McqAnswer> findByUserIdAndCodingTestId(Long userId, Long testId);
    List<McqAnswer> findByCodingTestId(Long testId);
    Optional<McqAnswer> findByUserIdAndMcqQuestionId(Long userId, Long mcqQuestionId);
    void deleteByUserIdAndCodingTestId(Long userId, Long testId);
    void deleteByCodingTestId(Long testId);
}
