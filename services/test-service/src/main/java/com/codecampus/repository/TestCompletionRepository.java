package com.codecampus.repository;

import com.codecampus.model.TestCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestCompletionRepository extends JpaRepository<TestCompletion, Long> {
    Optional<TestCompletion> findByUserIdAndCodingTestId(Long userId, Long testId);
    List<TestCompletion> findByUserId(Long userId);
    List<TestCompletion> findByCodingTestId(Long testId);
    boolean existsByUserIdAndCodingTestId(Long userId, Long testId);
    void deleteByCodingTestId(Long testId);
    void deleteByUserIdAndCodingTestId(Long userId, Long testId);
}
