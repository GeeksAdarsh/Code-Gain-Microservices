package com.codecampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_completions", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "test_id"}))
public class TestCompletion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "test_id", nullable = false)
    private CodingTest codingTest;

    private int totalQuestions;
    private int questionsAttempted;
    private int questionsAccepted;
    private int totalScore;
    private LocalDateTime completedAt;
    private boolean autoSubmitted = false;

    public TestCompletion() {}

    @PrePersist protected void onCreate() { completedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public CodingTest getCodingTest() { return codingTest; }
    public void setCodingTest(CodingTest codingTest) { this.codingTest = codingTest; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int v) { this.totalQuestions = v; }
    public int getQuestionsAttempted() { return questionsAttempted; }
    public void setQuestionsAttempted(int v) { this.questionsAttempted = v; }
    public int getQuestionsAccepted() { return questionsAccepted; }
    public void setQuestionsAccepted(int v) { this.questionsAccepted = v; }
    public int getTotalScore() { return totalScore; }
    public void setTotalScore(int v) { this.totalScore = v; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public boolean isAutoSubmitted() { return autoSubmitted; }
    public void setAutoSubmitted(boolean v) { this.autoSubmitted = v; }
}
