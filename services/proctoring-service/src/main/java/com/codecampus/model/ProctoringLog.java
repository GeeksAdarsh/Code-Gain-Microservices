package com.codecampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "proctoring_logs")
public class ProctoringLog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id") private User user;

    @Column(name = "test_id")
    private Long testId;

    @Enumerated(EnumType.STRING) private ProctoringEventType eventType;
    @Column(columnDefinition = "TEXT") private String details;
    @Column(columnDefinition = "LONGTEXT") private String snapshot;
    private int tabSwitchCount = 0;
    private boolean fullscreenExited = false;
    private boolean flagged = false;
    private LocalDateTime timestamp;

    public ProctoringLog() {}
    @PrePersist protected void onCreate() { timestamp = LocalDateTime.now(); }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User v) { this.user = v; }
    public Long getTestId() { return testId; }
    public void setTestId(Long v) { this.testId = v; }
    public ProctoringEventType getEventType() { return eventType; }
    public void setEventType(ProctoringEventType v) { this.eventType = v; }
    public String getDetails() { return details; }
    public void setDetails(String v) { this.details = v; }
    public String getSnapshot() { return snapshot; }
    public void setSnapshot(String v) { this.snapshot = v; }
    public int getTabSwitchCount() { return tabSwitchCount; }
    public void setTabSwitchCount(int v) { this.tabSwitchCount = v; }
    public boolean isFullscreenExited() { return fullscreenExited; }
    public void setFullscreenExited(boolean v) { this.fullscreenExited = v; }
    public boolean isFlagged() { return flagged; }
    public void setFlagged(boolean v) { this.flagged = v; }
    public LocalDateTime getTimestamp() { return timestamp; }

    public static PLBuilder builder() { return new PLBuilder(); }
    public static class PLBuilder {
        private final ProctoringLog p = new ProctoringLog();
        public PLBuilder user(User v) { p.user = v; return this; }
        public PLBuilder testId(Long v) { p.testId = v; return this; }
        public PLBuilder eventType(ProctoringEventType v) { p.eventType = v; return this; }
        public PLBuilder details(String v) { p.details = v; return this; }
        public PLBuilder snapshot(String v) { p.snapshot = v; return this; }
        public PLBuilder flagged(boolean v) { p.flagged = v; return this; }
        public ProctoringLog build() { return p; }
    }
}
