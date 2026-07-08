package com.codecampus.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;

public class CodingTestDTO {
    private Long id;
    @NotBlank private String title;
    private String description;
    private LocalDateTime startTime, endTime;
    private int durationMinutes;
    private boolean isActive, isPublished;
    private List<Long> questionIds;
    private String accessCode, createdByName;
    private int totalQuestions;
    private boolean currentlyActive;
    private boolean proctoringEnabled, cameraRequired, fullscreenRequired, plagiarismCheckEnabled;
    private int maxTabSwitches = 7, snapshotIntervalSeconds = 300;
    private int joinWindowMinutes = 20;
    private String testType = "COLLEGE", jobRole, companyName, experienceLevel;
    private int totalMarks = 100;
    private boolean restrictToSections;
    private List<Long> sectionIds;
    private List<QuestionWeightDTO> questionWeights;

    public CodingTestDTO() {}
    public Long getId() { return id; }
    public void setId(Long v) { this.id = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { this.title = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime v) { this.startTime = v; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime v) { this.endTime = v; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int v) { this.durationMinutes = v; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean v) { this.isActive = v; }
    public boolean isPublished() { return isPublished; }
    public void setPublished(boolean v) { this.isPublished = v; }
    public List<Long> getQuestionIds() { return questionIds; }
    public void setQuestionIds(List<Long> v) { this.questionIds = v; }
    public String getAccessCode() { return accessCode; }
    public void setAccessCode(String v) { this.accessCode = v; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String v) { this.createdByName = v; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int v) { this.totalQuestions = v; }
    public boolean isCurrentlyActive() { return currentlyActive; }
    public void setCurrentlyActive(boolean v) { this.currentlyActive = v; }
    public boolean isProctoringEnabled() { return proctoringEnabled; }
    public void setProctoringEnabled(boolean v) { this.proctoringEnabled = v; }
    public boolean isCameraRequired() { return cameraRequired; }
    public void setCameraRequired(boolean v) { this.cameraRequired = v; }
    public boolean isFullscreenRequired() { return fullscreenRequired; }
    public void setFullscreenRequired(boolean v) { this.fullscreenRequired = v; }
    public boolean isPlagiarismCheckEnabled() { return plagiarismCheckEnabled; }
    public void setPlagiarismCheckEnabled(boolean v) { this.plagiarismCheckEnabled = v; }
    public int getMaxTabSwitches() { return maxTabSwitches; }
    public void setMaxTabSwitches(int v) { this.maxTabSwitches = v; }
    public int getSnapshotIntervalSeconds() { return snapshotIntervalSeconds; }
    public void setSnapshotIntervalSeconds(int v) { this.snapshotIntervalSeconds = v; }
    public int getJoinWindowMinutes() { return joinWindowMinutes; }
    public void setJoinWindowMinutes(int v) { this.joinWindowMinutes = v; }
    public String getTestType() { return testType; }
    public void setTestType(String v) { this.testType = v; }
    public String getJobRole() { return jobRole; }
    public void setJobRole(String v) { this.jobRole = v; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String v) { this.companyName = v; }
    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String v) { this.experienceLevel = v; }
    public int getTotalMarks() { return totalMarks; }
    public void setTotalMarks(int v) { this.totalMarks = v; }
    public boolean isRestrictToSections() { return restrictToSections; }
    public void setRestrictToSections(boolean v) { this.restrictToSections = v; }
    public List<Long> getSectionIds() { return sectionIds; }
    public void setSectionIds(List<Long> v) { this.sectionIds = v; }
    public List<QuestionWeightDTO> getQuestionWeights() { return questionWeights; }
    public void setQuestionWeights(List<QuestionWeightDTO> v) { this.questionWeights = v; }

    public static class QuestionWeightDTO {
        private Long questionId;
        private int maxMarks;
        public QuestionWeightDTO() {}
        public QuestionWeightDTO(Long questionId, int maxMarks) { this.questionId = questionId; this.maxMarks = maxMarks; }
        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long v) { this.questionId = v; }
        public int getMaxMarks() { return maxMarks; }
        public void setMaxMarks(int v) { this.maxMarks = v; }
    }
}
