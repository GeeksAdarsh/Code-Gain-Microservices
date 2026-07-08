package com.codecampus.model;

import jakarta.persistence.*;

@Entity
@Table(name = "test_question_weights")
public class TestQuestionWeight {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "test_id", nullable = false)
    private CodingTest codingTest;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    private int maxMarks = 100;

    public TestQuestionWeight() {}

    public Long getId() { return id; }
    public CodingTest getCodingTest() { return codingTest; }
    public void setCodingTest(CodingTest v) { this.codingTest = v; }
    public Question getQuestion() { return question; }
    public void setQuestion(Question v) { this.question = v; }
    public int getMaxMarks() { return maxMarks; }
    public void setMaxMarks(int v) { this.maxMarks = v; }
}
