package com.codecampus.model;

import jakarta.persistence.*;

@Entity
@Table(name = "test_cases")
public class TestCase {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(columnDefinition = "TEXT") private String input;
    @Column(columnDefinition = "TEXT") private String expectedOutput;
    private boolean isSample = false;
    private boolean isHidden = true;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "question_id")
    private Question question;

    public TestCase() {}

    public Long getId() { return id; }
    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
    public boolean isSample() { return isSample; }
    public void setSample(boolean sample) { isSample = sample; }
    public boolean isHidden() { return isHidden; }
    public void setHidden(boolean hidden) { isHidden = hidden; }
    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }

    public static TCBuilder builder() { return new TCBuilder(); }
    public static class TCBuilder {
        private final TestCase t = new TestCase();
        public TCBuilder input(String v) { t.input = v; return this; }
        public TCBuilder expectedOutput(String v) { t.expectedOutput = v; return this; }
        public TCBuilder isSample(boolean v) { t.isSample = v; return this; }
        public TCBuilder isHidden(boolean v) { t.isHidden = v; return this; }
        public TCBuilder question(Question v) { t.question = v; return this; }
        public TestCase build() { return t; }
    }
}
