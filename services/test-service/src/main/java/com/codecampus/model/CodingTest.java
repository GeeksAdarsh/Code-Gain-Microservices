package com.codecampus.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "coding_tests")
public class CodingTest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank private String title;
    @Column(columnDefinition = "TEXT") private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int durationMinutes;
    private boolean isActive = false;
    private boolean isPublished = false;
    private boolean proctoringEnabled = false;
    private boolean cameraRequired = false;
    private boolean fullscreenRequired = false;
    private int maxTabSwitches = 7;
    private int snapshotIntervalSeconds = 300;
    private boolean plagiarismCheckEnabled = false;
    @Enumerated(EnumType.STRING) private TestType testType = TestType.COLLEGE;
    private String jobRole;
    private String companyName;
    private String experienceLevel;

    @ManyToMany
    @JoinTable(name = "test_questions", joinColumns = @JoinColumn(name = "test_id"), inverseJoinColumns = @JoinColumn(name = "question_id"))
    private List<Question> questions = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToMany
    @JoinTable(name = "test_participants", joinColumns = @JoinColumn(name = "test_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
    private List<User> allowedParticipants = new ArrayList<>();

    @ManyToMany
    @JoinTable(name = "test_sections", joinColumns = @JoinColumn(name = "test_id"), inverseJoinColumns = @JoinColumn(name = "section_id"))
    private List<Section> allowedSections = new ArrayList<>();

    private boolean restrictToSections = false;

    private String accessCode;
    private int totalMarks = 100;
    private int joinWindowMinutes = 20;
    private LocalDateTime createdAt;

    public CodingTest() {}

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public boolean isCurrentlyActive() {
        LocalDateTime now = LocalDateTime.now();
        return isActive && isPublished && now.isAfter(startTime) && now.isBefore(endTime);
    }

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    public boolean isPublished() { return isPublished; }
    public void setPublished(boolean published) { isPublished = published; }
    public boolean isProctoringEnabled() { return proctoringEnabled; }
    public void setProctoringEnabled(boolean v) { this.proctoringEnabled = v; }
    public boolean isCameraRequired() { return cameraRequired; }
    public void setCameraRequired(boolean v) { this.cameraRequired = v; }
    public boolean isFullscreenRequired() { return fullscreenRequired; }
    public void setFullscreenRequired(boolean v) { this.fullscreenRequired = v; }
    public int getMaxTabSwitches() { return maxTabSwitches; }
    public void setMaxTabSwitches(int v) { this.maxTabSwitches = v; }
    public int getSnapshotIntervalSeconds() { return snapshotIntervalSeconds; }
    public void setSnapshotIntervalSeconds(int v) { this.snapshotIntervalSeconds = v; }
    public boolean isPlagiarismCheckEnabled() { return plagiarismCheckEnabled; }
    public void setPlagiarismCheckEnabled(boolean v) { this.plagiarismCheckEnabled = v; }
    public TestType getTestType() { return testType; }
    public void setTestType(TestType v) { this.testType = v; }
    public String getJobRole() { return jobRole; }
    public void setJobRole(String v) { this.jobRole = v; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String v) { this.companyName = v; }
    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String v) { this.experienceLevel = v; }
    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> v) { this.questions = v; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User v) { this.createdBy = v; }
    public List<User> getAllowedParticipants() { return allowedParticipants; }
    public List<Section> getAllowedSections() { return allowedSections; }
    public void setAllowedSections(List<Section> v) { this.allowedSections = v; }
    public boolean isRestrictToSections() { return restrictToSections; }
    public void setRestrictToSections(boolean v) { this.restrictToSections = v; }
    public String getAccessCode() { return accessCode; }
    public void setAccessCode(String v) { this.accessCode = v; }
    public int getTotalMarks() { return totalMarks; }
    public void setTotalMarks(int v) { this.totalMarks = v; }
    public int getJoinWindowMinutes() { return joinWindowMinutes; }
    public void setJoinWindowMinutes(int v) { this.joinWindowMinutes = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public static CTBuilder builder() { return new CTBuilder(); }
    public static class CTBuilder {
        private final CodingTest t = new CodingTest();
        public CTBuilder id(Long v) { t.id = v; return this; }
        public CTBuilder title(String v) { t.title = v; return this; }
        public CTBuilder description(String v) { t.description = v; return this; }
        public CTBuilder startTime(LocalDateTime v) { t.startTime = v; return this; }
        public CTBuilder endTime(LocalDateTime v) { t.endTime = v; return this; }
        public CTBuilder durationMinutes(int v) { t.durationMinutes = v; return this; }
        public CTBuilder isActive(boolean v) { t.isActive = v; return this; }
        public CTBuilder isPublished(boolean v) { t.isPublished = v; return this; }
        public CTBuilder proctoringEnabled(boolean v) { t.proctoringEnabled = v; return this; }
        public CTBuilder cameraRequired(boolean v) { t.cameraRequired = v; return this; }
        public CTBuilder fullscreenRequired(boolean v) { t.fullscreenRequired = v; return this; }
        public CTBuilder maxTabSwitches(int v) { t.maxTabSwitches = v; return this; }
        public CTBuilder snapshotIntervalSeconds(int v) { t.snapshotIntervalSeconds = v; return this; }
        public CTBuilder plagiarismCheckEnabled(boolean v) { t.plagiarismCheckEnabled = v; return this; }
        public CTBuilder testType(TestType v) { t.testType = v; return this; }
        public CTBuilder jobRole(String v) { t.jobRole = v; return this; }
        public CTBuilder companyName(String v) { t.companyName = v; return this; }
        public CTBuilder experienceLevel(String v) { t.experienceLevel = v; return this; }
        public CTBuilder questions(List<Question> v) { t.questions = v; return this; }
        public CTBuilder createdBy(User v) { t.createdBy = v; return this; }
        public CTBuilder accessCode(String v) { t.accessCode = v; return this; }
        public CTBuilder totalMarks(int v) { t.totalMarks = v; return this; }
        public CodingTest build() { return t; }
    }
}
