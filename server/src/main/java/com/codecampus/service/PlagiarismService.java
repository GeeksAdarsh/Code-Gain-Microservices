package com.codecampus.service;

import com.codecampus.model.*;
import com.codecampus.repository.PlagiarismReportRepository;
import com.codecampus.repository.SubmissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PlagiarismService {
    private static final Logger log = LoggerFactory.getLogger(PlagiarismService.class);
    private final SubmissionRepository submissionRepository;
    private final PlagiarismReportRepository reportRepository;
    private final NotificationService notificationService;
    @Value("${plagiarism.similarity-threshold:70}") private int similarityThreshold;

    public PlagiarismService(SubmissionRepository submissionRepository, PlagiarismReportRepository reportRepository, NotificationService notificationService) {
        this.submissionRepository = submissionRepository;
        this.reportRepository = reportRepository;
        this.notificationService = notificationService;
    }

    public List<Map<String, Object>> runPlagiarismCheck(Long testId) {
        List<Submission> submissions = submissionRepository.findByCodingTestId(testId);
        Map<Long, List<Submission>> byQ = submissions.stream().filter(s -> s.getQuestion() != null).collect(Collectors.groupingBy(s -> s.getQuestion().getId()));
        List<Map<String, Object>> results = new ArrayList<>();
        for (var entry : byQ.entrySet()) {
            List<Submission> subs = entry.getValue();
            for (int i = 0; i < subs.size(); i++) for (int j = i + 1; j < subs.size(); j++) {
                Submission s1 = subs.get(i), s2 = subs.get(j);
                if (s1.getUser().getId().equals(s2.getUser().getId())) continue;
                double sim = calculateSimilarity(s1.getCode(), s2.getCode());
                if (sim >= similarityThreshold) {
                    PlagiarismReport r = PlagiarismReport.builder().codingTest(s1.getCodingTest()).question(s1.getQuestion()).submission1(s1).submission2(s2).user1(s1.getUser()).user2(s2.getUser()).similarityPercentage(sim).matchedTokens(findMatches(s1.getCode(), s2.getCode())).status(PlagiarismStatus.DETECTED).build();
                    reportRepository.save(r);
                    CodingTest ct = s1.getCodingTest();
                    if (ct != null) {
                        notificationService.notifyPlagiarismDetected(ct,
                            "Plagiarism detected in \"" + ct.getTitle() + "\" — " + s1.getUser().getFullName() + " & " + s2.getUser().getFullName() + " (" + Math.round(sim) + "%). Review required.");
                    }
                    Map<String, Object> res = new HashMap<>(); res.put("questionId", entry.getKey()); res.put("user1", s1.getUser().getFullName()); res.put("user2", s2.getUser().getFullName()); res.put("similarity", Math.round(sim * 100.0) / 100.0); res.put("reportId", r.getId()); results.add(res);
                    log.warn("⚠️ Plagiarism: {}% between {} and {}", Math.round(sim), s1.getUser().getUsername(), s2.getUser().getUsername());
                }
            }
        }
        return results;
    }

    public double calculateSimilarity(String c1, String c2) {
        if (c1 == null || c2 == null) return 0;
        String n1 = normalize(c1), n2 = normalize(c2);
        return jaccardSim(tokenize(n1), tokenize(n2)) * 0.4 + ngramSim(n1, n2, 3) * 0.3 + lcsRatio(n1, n2) * 0.3;
    }

    private String normalize(String c) { c = c.replaceAll("/\\*[\\s\\S]*?\\*/", "").replaceAll("//.*", "").replaceAll("#.*", "").replaceAll("\"[^\"]*\"", "S").replaceAll("'[^']*'", "C").replaceAll("\\s+", " ").trim().toLowerCase(); return c; }
    private Set<String> tokenize(String c) { Set<String> s = new HashSet<>(); for (String t : c.split("[^a-zA-Z0-9_]+")) if (t.length() > 1) s.add(t); return s; }
    private double jaccardSim(Set<String> a, Set<String> b) { if (a.isEmpty() && b.isEmpty()) return 100; Set<String> inter = new HashSet<>(a); inter.retainAll(b); Set<String> union = new HashSet<>(a); union.addAll(b); return union.isEmpty() ? 0 : (double)inter.size()/union.size()*100; }
    private double ngramSim(String a, String b, int n) { return jaccardSim(ngrams(a,n), ngrams(b,n)); }
    private Set<String> ngrams(String t, int n) { Set<String> s = new HashSet<>(); for (int i=0;i<=t.length()-n;i++) s.add(t.substring(i,i+n)); return s; }
    private double lcsRatio(String a, String b) { if(a.length()>2000) a=a.substring(0,2000); if(b.length()>2000) b=b.substring(0,2000); int m=a.length(),n=b.length(); if(m==0||n==0) return 0; int[]p=new int[n+1],c=new int[n+1]; for(int i=1;i<=m;i++){for(int j=1;j<=n;j++){if(a.charAt(i-1)==b.charAt(j-1))c[j]=p[j-1]+1;else c[j]=Math.max(p[j],c[j-1]);}p=c.clone();} return (double)c[n]/Math.max(m,n)*100; }
    private String findMatches(String c1, String c2) { String[]l1=c1.split("\n"),l2=c2.split("\n"); List<String>m=new ArrayList<>(); for(String a:l1){String t=a.trim();if(t.length()<10)continue;for(String b:l2)if(t.equals(b.trim())){m.add(t);break;}} return String.join("\n---\n",m.stream().limit(20).collect(Collectors.toList())); }
    public List<PlagiarismReport> getReportsForTest(Long testId) { return reportRepository.findByCodingTestId(testId); }
    public PlagiarismReport updateReportStatus(Long id, PlagiarismStatus status, String notes, User reviewer) { PlagiarismReport r = reportRepository.findById(id).orElseThrow(); r.setStatus(status); r.setReviewNotes(notes); r.setReviewedBy(reviewer); r.setReviewedAt(java.time.LocalDateTime.now()); return reportRepository.save(r); }
}
