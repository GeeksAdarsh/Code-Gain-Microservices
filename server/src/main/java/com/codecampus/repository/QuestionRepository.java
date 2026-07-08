package com.codecampus.repository;

import com.codecampus.model.Difficulty;
import com.codecampus.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByDifficulty(Difficulty difficulty);
    List<Question> findByCreatedById(Long userId);

    @Query("SELECT q FROM Question q WHERE q.title LIKE CONCAT('%', :keyword, '%') OR q.description LIKE CONCAT('%', :keyword, '%')")
    List<Question> searchByKeyword(String keyword);

    long countByDifficulty(Difficulty difficulty);
    boolean existsByTitle(String title);
}
