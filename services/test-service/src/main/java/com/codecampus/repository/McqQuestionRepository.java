package com.codecampus.repository;

import com.codecampus.model.McqQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface McqQuestionRepository extends JpaRepository<McqQuestion, Long> {
    List<McqQuestion> findByCodingTestIdOrderByOrderIndexAsc(Long testId);
    void deleteByCodingTestId(Long testId);
}
