package com.codecampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
public class Submission {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id") private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "question_id") private Question question;
    @Column(name = "test_id") private Long testId;
    @Column(columnDefinition = "TEXT") private String code;
    @Enumerated(EnumType.STRING) private ProgrammingLanguage language;
    @Enumerated(EnumType.STRING) private SubmissionStatus status;
    private int testCasesPassed = 0;
    private int totalTestCases = 0;
    private long executionTimeMs = 0;
    private long memoryUsedKb = 0;
    @Column(columnDefinition = "TEXT") private String output;
    @Column(columnDefinition = "TEXT") private String errorOutput;
    private int score = 0;
    private LocalDateTime submittedAt;

    public Submission() {}
    @PrePersist protected void onCreate() { submittedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public ProgrammingLanguage getLanguage() { return language; }
    public void setLanguage(ProgrammingLanguage language) { this.language = language; }
    public SubmissionStatus getStatus() { return status; }
    public void setStatus(SubmissionStatus status) { this.status = status; }
    public int getTestCasesPassed() { return testCasesPassed; }
    public void setTestCasesPassed(int v) { this.testCasesPassed = v; }
    public int getTotalTestCases() { return totalTestCases; }
    public void setTotalTestCases(int v) { this.totalTestCases = v; }
    public long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(long v) { this.executionTimeMs = v; }
    public long getMemoryUsedKb() { return memoryUsedKb; }
    public String getOutput() { return output; }
    public void setOutput(String output) { this.output = output; }
    public String getErrorOutput() { return errorOutput; }
    public void setErrorOutput(String errorOutput) { this.errorOutput = errorOutput; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }

    public static SubBuilder builder() { return new SubBuilder(); }
    public static class SubBuilder {
        private final Submission s = new Submission();
        public SubBuilder user(User v) { s.user = v; return this; }
        public SubBuilder question(Question v) { s.question = v; return this; }
        public SubBuilder testId(Long v) { s.testId = v; return this; }
        public SubBuilder code(String v) { s.code = v; return this; }
        public SubBuilder language(ProgrammingLanguage v) { s.language = v; return this; }
        public SubBuilder status(SubmissionStatus v) { s.status = v; return this; }
        public SubBuilder testCasesPassed(int v) { s.testCasesPassed = v; return this; }
        public SubBuilder totalTestCases(int v) { s.totalTestCases = v; return this; }
        public SubBuilder executionTimeMs(long v) { s.executionTimeMs = v; return this; }
        public SubBuilder score(int v) { s.score = v; return this; }
        public SubBuilder output(String v) { s.output = v; return this; }
        public SubBuilder errorOutput(String v) { s.errorOutput = v; return this; }
        public Submission build() { return s; }
    }
}
