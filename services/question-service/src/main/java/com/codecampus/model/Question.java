package com.codecampus.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
public class Question {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank private String title;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(columnDefinition = "TEXT") private String inputFormat;
    @Column(columnDefinition = "TEXT") private String outputFormat;
    @Column(columnDefinition = "TEXT") private String constraints;
    @Enumerated(EnumType.STRING) private Difficulty difficulty;

    @ElementCollection
    @CollectionTable(name = "question_tags", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @Column(columnDefinition = "TEXT") private String sampleInput;
    @Column(columnDefinition = "TEXT") private String sampleOutput;
    @Column(columnDefinition = "TEXT") private String explanation;
    private int timeLimit = 2;
    private int memoryLimit = 256;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TestCase> testCases = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by")
    private User createdBy;

    private LocalDateTime createdAt;

    public Question() {}

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getInputFormat() { return inputFormat; }
    public void setInputFormat(String inputFormat) { this.inputFormat = inputFormat; }
    public String getOutputFormat() { return outputFormat; }
    public void setOutputFormat(String outputFormat) { this.outputFormat = outputFormat; }
    public String getConstraints() { return constraints; }
    public void setConstraints(String constraints) { this.constraints = constraints; }
    public Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Difficulty difficulty) { this.difficulty = difficulty; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public String getSampleInput() { return sampleInput; }
    public void setSampleInput(String sampleInput) { this.sampleInput = sampleInput; }
    public String getSampleOutput() { return sampleOutput; }
    public void setSampleOutput(String sampleOutput) { this.sampleOutput = sampleOutput; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public int getTimeLimit() { return timeLimit; }
    public void setTimeLimit(int timeLimit) { this.timeLimit = timeLimit; }
    public int getMemoryLimit() { return memoryLimit; }
    public void setMemoryLimit(int memoryLimit) { this.memoryLimit = memoryLimit; }
    public List<TestCase> getTestCases() { return testCases; }
    public void setTestCases(List<TestCase> testCases) { this.testCases = testCases; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public static QuestionBuilder builder() { return new QuestionBuilder(); }
    public static class QuestionBuilder {
        private final Question q = new Question();
        public QuestionBuilder title(String v) { q.title = v; return this; }
        public QuestionBuilder description(String v) { q.description = v; return this; }
        public QuestionBuilder inputFormat(String v) { q.inputFormat = v; return this; }
        public QuestionBuilder outputFormat(String v) { q.outputFormat = v; return this; }
        public QuestionBuilder constraints(String v) { q.constraints = v; return this; }
        public QuestionBuilder difficulty(Difficulty v) { q.difficulty = v; return this; }
        public QuestionBuilder tags(List<String> v) { q.tags = v; return this; }
        public QuestionBuilder sampleInput(String v) { q.sampleInput = v; return this; }
        public QuestionBuilder sampleOutput(String v) { q.sampleOutput = v; return this; }
        public QuestionBuilder explanation(String v) { q.explanation = v; return this; }
        public QuestionBuilder timeLimit(int v) { q.timeLimit = v; return this; }
        public QuestionBuilder memoryLimit(int v) { q.memoryLimit = v; return this; }
        public QuestionBuilder createdBy(User v) { q.createdBy = v; return this; }
        public Question build() { return q; }
    }
}
