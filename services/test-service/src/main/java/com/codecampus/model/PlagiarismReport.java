package com.codecampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "plagiarism_reports")
public class PlagiarismReport {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "test_id") private CodingTest codingTest;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "question_id") private Question question;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "submission1_id") private Submission submission1;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "submission2_id") private Submission submission2;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user1_id") private User user1;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user2_id") private User user2;
    private double similarityPercentage;
    @Column(columnDefinition = "TEXT") private String matchedTokens;
    @Enumerated(EnumType.STRING) private PlagiarismStatus status = PlagiarismStatus.DETECTED;
    @Column(columnDefinition = "TEXT") private String reviewNotes;
    private LocalDateTime detectedAt;
    private LocalDateTime reviewedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reviewed_by") private User reviewedBy;

    public PlagiarismReport() {}
    @PrePersist protected void onCreate() { detectedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public CodingTest getCodingTest() { return codingTest; }
    public Question getQuestion() { return question; }
    public Submission getSubmission1() { return submission1; }
    public Submission getSubmission2() { return submission2; }
    public User getUser1() { return user1; }
    public User getUser2() { return user2; }
    public double getSimilarityPercentage() { return similarityPercentage; }
    public String getMatchedTokens() { return matchedTokens; }
    public PlagiarismStatus getStatus() { return status; }
    public void setStatus(PlagiarismStatus v) { this.status = v; }
    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String v) { this.reviewNotes = v; }
    public LocalDateTime getDetectedAt() { return detectedAt; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime v) { this.reviewedAt = v; }
    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User v) { this.reviewedBy = v; }

    public static PRBuilder builder() { return new PRBuilder(); }
    public static class PRBuilder {
        private final PlagiarismReport r = new PlagiarismReport();
        public PRBuilder codingTest(CodingTest v) { r.codingTest = v; return this; }
        public PRBuilder question(Question v) { r.question = v; return this; }
        public PRBuilder submission1(Submission v) { r.submission1 = v; return this; }
        public PRBuilder submission2(Submission v) { r.submission2 = v; return this; }
        public PRBuilder user1(User v) { r.user1 = v; return this; }
        public PRBuilder user2(User v) { r.user2 = v; return this; }
        public PRBuilder similarityPercentage(double v) { r.similarityPercentage = v; return this; }
        public PRBuilder matchedTokens(String v) { r.matchedTokens = v; return this; }
        public PRBuilder status(PlagiarismStatus v) { r.status = v; return this; }
        public PlagiarismReport build() { return r; }
    }
}
