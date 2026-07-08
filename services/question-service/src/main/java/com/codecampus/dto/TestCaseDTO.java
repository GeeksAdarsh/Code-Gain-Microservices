package com.codecampus.dto;

public class TestCaseDTO {
    private Long id;
    private String input;
    private String expectedOutput;
    private boolean isSample;
    private boolean isHidden;

    public TestCaseDTO() {}
    public TestCaseDTO(Long id, String input, String expectedOutput, boolean isSample, boolean isHidden) {
        this.id = id; this.input = input; this.expectedOutput = expectedOutput;
        this.isSample = isSample; this.isHidden = isHidden;
    }
    public Long getId() { return id; }
    public String getInput() { return input; }
    public String getExpectedOutput() { return expectedOutput; }
    public boolean isSample() { return isSample; }
    public boolean isHidden() { return isHidden; }
}
