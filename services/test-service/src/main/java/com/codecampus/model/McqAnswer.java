package com.codecampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mcq_answers", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "mcq_question_id"}))
public class McqAnswer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mcq_question_id")
    private McqQuestion mcqQuestion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private CodingTest codingTest;

    private String selectedOption;
    private boolean isCorrect;
    private LocalDateTime answeredAt;

    public McqAnswer() {}

    @PrePersist
    protected void onCreate() { answeredAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User v) { this.user = v; }
    public McqQuestion getMcqQuestion() { return mcqQuestion; }
    public void setMcqQuestion(McqQuestion v) { this.mcqQuestion = v; }
    public CodingTest getCodingTest() { return codingTest; }
    public void setCodingTest(CodingTest v) { this.codingTest = v; }
    public String getSelectedOption() { return selectedOption; }
    public void setSelectedOption(String v) { this.selectedOption = v; }
    public boolean isCorrect() { return isCorrect; }
    public void setCorrect(boolean v) { this.isCorrect = v; }
    public LocalDateTime getAnsweredAt() { return answeredAt; }
}
