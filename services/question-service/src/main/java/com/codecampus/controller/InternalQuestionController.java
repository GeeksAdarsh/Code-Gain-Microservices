package com.codecampus.controller;

import com.codecampus.dto.QuestionDTO;
import com.codecampus.dto.TestCaseDTO;
import com.codecampus.model.Question;
import com.codecampus.model.TestCase;
import com.codecampus.repository.QuestionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Internal endpoint — consumed only by execution-service and test-service.
 * Not exposed externally via the Gateway.
 */
@RestController
@RequestMapping("/internal/questions")
public class InternalQuestionController {

    private final QuestionRepository questionRepository;

    public InternalQuestionController(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionDTO> getQuestion(@PathVariable Long id) {
        return questionRepository.findById(id)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<QuestionDTO>> getQuestions(@RequestParam List<Long> ids) {
        List<QuestionDTO> dtos = questionRepository.findAllById(ids).stream()
                .map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    private QuestionDTO toDTO(Question q) {
        QuestionDTO dto = new QuestionDTO();
        dto.setId(q.getId());
        dto.setTitle(q.getTitle());
        dto.setDescription(q.getDescription());
        dto.setDifficulty(q.getDifficulty());
        dto.setTimeLimit(q.getTimeLimit());
        dto.setMemoryLimit(q.getMemoryLimit());
        dto.setTags(q.getTags() != null ? new ArrayList<>(q.getTags()) : new ArrayList<>());
        if (q.getTestCases() != null) {
            dto.setTestCases(q.getTestCases().stream()
                    .map(tc -> new TestCaseDTO(tc.getId(), tc.getInput(), tc.getExpectedOutput(),
                            tc.isSample(), tc.isHidden()))
                    .collect(Collectors.toList()));
        }
        return dto;
    }
}
