package com.codecampus.dto;

import com.codecampus.model.Difficulty;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

public class QuestionDTO {
    private Long id;
    @NotBlank private String title;
    @NotBlank private String description;
    private String inputFormat, outputFormat, constraints;
    private Difficulty difficulty;
    private List<String> tags = new ArrayList<>();
    private String sampleInput, sampleOutput, explanation;
    private int timeLimit = 2, memoryLimit = 256;
    private List<TestCaseDTO> testCases = new ArrayList<>();
    private String createdByName;

    public QuestionDTO() {}
    public Long getId() { return id; }
    public void setId(Long v) { this.id = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { this.title = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public String getInputFormat() { return inputFormat; }
    public void setInputFormat(String v) { this.inputFormat = v; }
    public String getOutputFormat() { return outputFormat; }
    public void setOutputFormat(String v) { this.outputFormat = v; }
    public String getConstraints() { return constraints; }
    public void setConstraints(String v) { this.constraints = v; }
    public Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Difficulty v) { this.difficulty = v; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> v) { this.tags = v; }
    public String getSampleInput() { return sampleInput; }
    public void setSampleInput(String v) { this.sampleInput = v; }
    public String getSampleOutput() { return sampleOutput; }
    public void setSampleOutput(String v) { this.sampleOutput = v; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String v) { this.explanation = v; }
    public int getTimeLimit() { return timeLimit; }
    public void setTimeLimit(int v) { this.timeLimit = v; }
    public int getMemoryLimit() { return memoryLimit; }
    public void setMemoryLimit(int v) { this.memoryLimit = v; }
    public List<TestCaseDTO> getTestCases() { return testCases; }
    public void setTestCases(List<TestCaseDTO> v) { this.testCases = v; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String v) { this.createdByName = v; }
}
