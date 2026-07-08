package com.codecampus.repository;

import com.codecampus.model.TestQuestionWeight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestQuestionWeightRepository extends JpaRepository<TestQuestionWeight, Long> {
    List<TestQuestionWeight> findByCodingTestId(Long testId);
    Optional<TestQuestionWeight> findByCodingTestIdAndQuestionId(Long testId, Long questionId);
    void deleteByCodingTestId(Long testId);
}
