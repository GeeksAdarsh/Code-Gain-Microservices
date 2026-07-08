package com.codecampus.dto;

import com.codecampus.model.SubmissionStatus;

import java.util.ArrayList;
import java.util.List;

public class CodeExecutionResponse {
    private String output;
    private String errorOutput;
    private SubmissionStatus status;
    private long executionTimeMs;
    private long memoryUsedKb;
    private int testCasesPassed;
    private int totalTestCases;
    private int score;
    // First failed test case details
    private String failedInput;
    private String failedExpected;
    private String failedActual;
    private int failedTestCaseNumber;
    /** Pattern-based hints (no external AI). */
    private List<String> codeReview = new ArrayList<>();

    public CodeExecutionResponse() {}
    public String getOutput() { return output; }
    public String getErrorOutput() { return errorOutput; }
    public SubmissionStatus getStatus() { return status; }
    public long getExecutionTimeMs() { return executionTimeMs; }
    public long getMemoryUsedKb() { return memoryUsedKb; }
    public int getTestCasesPassed() { return testCasesPassed; }
    public int getTotalTestCases() { return totalTestCases; }
    public int getScore() { return score; }
    public String getFailedInput() { return failedInput; }
    public String getFailedExpected() { return failedExpected; }
    public String getFailedActual() { return failedActual; }
    public int getFailedTestCaseNumber() { return failedTestCaseNumber; }
    public List<String> getCodeReview() { return codeReview; }
    public void setCodeReview(List<String> codeReview) { this.codeReview = codeReview != null ? codeReview : new ArrayList<>(); }

    public static CERBuilder builder() { return new CERBuilder(); }
    public static class CERBuilder {
        private final CodeExecutionResponse r = new CodeExecutionResponse();
        public CERBuilder output(String v) { r.output = v; return this; }
        public CERBuilder errorOutput(String v) { r.errorOutput = v; return this; }
        public CERBuilder status(SubmissionStatus v) { r.status = v; return this; }
        public CERBuilder executionTimeMs(long v) { r.executionTimeMs = v; return this; }
        public CERBuilder memoryUsedKb(long v) { r.memoryUsedKb = v; return this; }
        public CERBuilder testCasesPassed(int v) { r.testCasesPassed = v; return this; }
        public CERBuilder totalTestCases(int v) { r.totalTestCases = v; return this; }
        public CERBuilder score(int v) { r.score = v; return this; }
        public CERBuilder failedInput(String v) { r.failedInput = v; return this; }
        public CERBuilder failedExpected(String v) { r.failedExpected = v; return this; }
        public CERBuilder failedActual(String v) { r.failedActual = v; return this; }
        public CERBuilder failedTestCaseNumber(int v) { r.failedTestCaseNumber = v; return this; }
        public CERBuilder codeReview(List<String> v) { r.codeReview = v != null ? v : new ArrayList<>(); return this; }
        public CodeExecutionResponse build() { return r; }
    }
}
