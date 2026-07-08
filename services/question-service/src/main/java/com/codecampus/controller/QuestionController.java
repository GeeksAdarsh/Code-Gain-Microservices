package com.codecampus.controller;

import com.codecampus.dto.QuestionDTO;
import com.codecampus.model.ProgrammingLanguage;
import com.codecampus.model.User;
import com.codecampus.service.HarnessRegistry;
import com.codecampus.service.QuestionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {
    private final QuestionService questionService;
    private final HarnessRegistry harnessRegistry;
    public QuestionController(QuestionService questionService, HarnessRegistry harnessRegistry) {
        this.questionService = questionService;
        this.harnessRegistry = harnessRegistry;
    }

    @GetMapping public ResponseEntity<List<QuestionDTO>> getAll() { return ResponseEntity.ok(questionService.getAllQuestions()); }

    /** Paginated catalog: /api/questions/page?page=0&size=20. Cheaper than fetching all at once under load. */
    @GetMapping("/page")
    public ResponseEntity<Page<QuestionDTO>> getPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by("id").ascending());
        return ResponseEntity.ok(questionService.getQuestionsPage(pageable));
    }

    @GetMapping("/{id}") public ResponseEntity<QuestionDTO> getById(@PathVariable Long id) { return ResponseEntity.ok(questionService.getQuestionById(id)); }

    /** LeetCode-style starter code for a problem+language, or functionMode=false if not supported. */
    @GetMapping("/{id}/starter")
    public ResponseEntity<Map<String, Object>> getStarter(@PathVariable Long id, @RequestParam String language) {
        Map<String, Object> body = new HashMap<>();
        ProgrammingLanguage lang;
        try {
            lang = ProgrammingLanguage.valueOf(language);
        } catch (IllegalArgumentException e) {
            body.put("functionMode", false);
            return ResponseEntity.ok(body);
        }
        String title = questionService.getQuestionById(id).getTitle();
        String starter = harnessRegistry.starter(title, lang);
        body.put("functionMode", starter != null);
        body.put("starterCode", starter);
        return ResponseEntity.ok(body);
    }

    @PostMapping @PreAuthorize("hasAnyRole('TEACHER','ADMIN','COMPANY')")
    public ResponseEntity<QuestionDTO> create(@Valid @RequestBody QuestionDTO dto, @AuthenticationPrincipal User user) { return ResponseEntity.ok(questionService.createQuestion(dto, user)); }

    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<QuestionDTO> update(@PathVariable Long id, @Valid @RequestBody QuestionDTO dto) { return ResponseEntity.ok(questionService.updateQuestion(id, dto)); }

    @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) { questionService.deleteQuestion(id); return ResponseEntity.ok().build(); }
}
