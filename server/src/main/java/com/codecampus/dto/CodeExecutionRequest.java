package com.codecampus.dto;

import com.codecampus.model.ProgrammingLanguage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CodeExecutionRequest {
    @NotBlank private String code;
    @NotNull private ProgrammingLanguage language;
    private String input = "";
    private Long questionId;
    /** When set without judging all hidden tests, hints use this problem's tags/title (Run / custom input). */
    private Long reviewQuestionId;
    private Long testId;

    public CodeExecutionRequest() {}
    public String getCode() { return code; }
    public void setCode(String v) { this.code = v; }
    public ProgrammingLanguage getLanguage() { return language; }
    public void setLanguage(ProgrammingLanguage v) { this.language = v; }
    public String getInput() { return input; }
    public void setInput(String v) { this.input = v; }
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long v) { this.questionId = v; }
    public Long getReviewQuestionId() { return reviewQuestionId; }
    public void setReviewQuestionId(Long v) { this.reviewQuestionId = v; }
    public Long getTestId() { return testId; }
    public void setTestId(Long v) { this.testId = v; }
}
