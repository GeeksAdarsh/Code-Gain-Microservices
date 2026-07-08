package com.codecampus.service;

import com.codecampus.dto.QuestionDTO;
import com.codecampus.dto.TestCaseDTO;
import com.codecampus.model.*;
import com.codecampus.repository.QuestionRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;

    public QuestionService(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    // The problem catalog is the same for everyone and changes rarely, so cache it
    // instead of re-querying + re-serializing all problems on every page load.
    @Cacheable("allQuestions")
    @Transactional(readOnly = true)
    public List<QuestionDTO> getAllQuestions() { return questionRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList()); }

    /** Paginated catalog — preferred for large lists so we don't ship every problem at once. */
    public Page<QuestionDTO> getQuestionsPage(Pageable pageable) {
        return questionRepository.findAll(pageable).map(this::toDTO);
    }

    public QuestionDTO getQuestionById(Long id) { return toDTO(questionRepository.findById(id).orElseThrow(() -> new RuntimeException("Question not found"))); }

    @Transactional
    @CacheEvict(value = "allQuestions", allEntries = true)
    public QuestionDTO createQuestion(QuestionDTO dto, User creator) {
        Question q = Question.builder().title(dto.getTitle()).description(dto.getDescription()).inputFormat(dto.getInputFormat()).outputFormat(dto.getOutputFormat()).constraints(dto.getConstraints()).difficulty(dto.getDifficulty()).tags(dto.getTags()).sampleInput(dto.getSampleInput()).sampleOutput(dto.getSampleOutput()).explanation(dto.getExplanation()).timeLimit(dto.getTimeLimit()).memoryLimit(dto.getMemoryLimit()).createdBy(creator).build();
        if (dto.getTestCases() != null) { q.setTestCases(dto.getTestCases().stream().map(tc -> TestCase.builder().input(tc.getInput()).expectedOutput(tc.getExpectedOutput()).isSample(tc.isSample()).isHidden(tc.isHidden()).question(q).build()).collect(Collectors.toList())); }
        return toDTO(questionRepository.save(q));
    }

    @Transactional
    @CacheEvict(value = "allQuestions", allEntries = true)
    public QuestionDTO updateQuestion(Long id, QuestionDTO dto) {
        Question q = questionRepository.findById(id).orElseThrow(() -> new RuntimeException("Question not found"));
        q.setTitle(dto.getTitle()); q.setDescription(dto.getDescription()); q.setInputFormat(dto.getInputFormat()); q.setOutputFormat(dto.getOutputFormat()); q.setConstraints(dto.getConstraints()); q.setDifficulty(dto.getDifficulty()); q.setTags(dto.getTags()); q.setSampleInput(dto.getSampleInput()); q.setSampleOutput(dto.getSampleOutput()); q.setExplanation(dto.getExplanation()); q.setTimeLimit(dto.getTimeLimit()); q.setMemoryLimit(dto.getMemoryLimit());
        if (dto.getTestCases() != null) { q.getTestCases().clear(); dto.getTestCases().forEach(tc -> q.getTestCases().add(TestCase.builder().input(tc.getInput()).expectedOutput(tc.getExpectedOutput()).isSample(tc.isSample()).isHidden(tc.isHidden()).question(q).build())); }
        return toDTO(questionRepository.save(q));
    }

    @CacheEvict(value = "allQuestions", allEntries = true)
    public void deleteQuestion(Long id) { questionRepository.deleteById(id); }

    private QuestionDTO toDTO(Question q) {
        QuestionDTO dto = new QuestionDTO();
        dto.setId(q.getId()); dto.setTitle(q.getTitle()); dto.setDescription(q.getDescription()); dto.setInputFormat(q.getInputFormat()); dto.setOutputFormat(q.getOutputFormat()); dto.setConstraints(q.getConstraints()); dto.setDifficulty(q.getDifficulty());
        dto.setTags(q.getTags() != null ? new ArrayList<>(q.getTags()) : new ArrayList<>()); dto.setSampleInput(q.getSampleInput()); dto.setSampleOutput(q.getSampleOutput()); dto.setExplanation(q.getExplanation()); dto.setTimeLimit(q.getTimeLimit()); dto.setMemoryLimit(q.getMemoryLimit()); dto.setCreatedByName(q.getCreatedBy() != null ? q.getCreatedBy().getFullName() : null);
        if (q.getTestCases() != null) dto.setTestCases(q.getTestCases().stream().map(tc -> new TestCaseDTO(tc.getId(), tc.getInput(), tc.getExpectedOutput(), tc.isSample(), tc.isHidden())).collect(Collectors.toList()));
        return dto;
    }
}
