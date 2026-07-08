package com.codecampus.model;

import jakarta.persistence.*;

@Entity
@Table(name = "mcq_questions")
public class McqQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private CodingTest codingTest;

    @Column(columnDefinition = "TEXT")
    private String question;

    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;

    private String correctOption;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    private int marks = 1;
    private int orderIndex;

    public McqQuestion() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CodingTest getCodingTest() { return codingTest; }
    public void setCodingTest(CodingTest ct) { this.codingTest = ct; }
    public String getQuestion() { return question; }
    public void setQuestion(String v) { this.question = v; }
    public String getOptionA() { return optionA; }
    public void setOptionA(String v) { this.optionA = v; }
    public String getOptionB() { return optionB; }
    public void setOptionB(String v) { this.optionB = v; }
    public String getOptionC() { return optionC; }
    public void setOptionC(String v) { this.optionC = v; }
    public String getOptionD() { return optionD; }
    public void setOptionD(String v) { this.optionD = v; }
    public String getCorrectOption() { return correctOption; }
    public void setCorrectOption(String v) { this.correctOption = v; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String v) { this.explanation = v; }
    public int getMarks() { return marks; }
    public void setMarks(int v) { this.marks = v; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int v) { this.orderIndex = v; }
}
