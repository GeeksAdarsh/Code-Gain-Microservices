package com.codecampus.controller;

import com.codecampus.model.PlagiarismReport;
import com.codecampus.model.PlagiarismStatus;
import com.codecampus.model.User;
import com.codecampus.service.PlagiarismService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/plagiarism")
public class PlagiarismController {
    private final PlagiarismService plagiarismService;
    public PlagiarismController(PlagiarismService plagiarismService) { this.plagiarismService = plagiarismService; }

    @PostMapping("/check/{testId}") @PreAuthorize("hasAnyRole('TEACHER','ADMIN','COMPANY')")
    public ResponseEntity<List<Map<String, Object>>> runCheck(@PathVariable Long testId) { return ResponseEntity.ok(plagiarismService.runPlagiarismCheck(testId)); }

    @GetMapping("/reports/{testId}") @PreAuthorize("hasAnyRole('TEACHER','ADMIN','COMPANY')")
    public ResponseEntity<List<Map<String, Object>>> getReports(@PathVariable Long testId) {
        return ResponseEntity.ok(plagiarismService.getReportsForTest(testId).stream().map(r -> { Map<String,Object> m=new HashMap<>(); m.put("id",r.getId()); m.put("user1Name",r.getUser1()!=null?r.getUser1().getFullName():""); m.put("user2Name",r.getUser2()!=null?r.getUser2().getFullName():""); m.put("user1Username",r.getUser1()!=null?r.getUser1().getUsername():""); m.put("user2Username",r.getUser2()!=null?r.getUser2().getUsername():""); m.put("similarity",r.getSimilarityPercentage()); m.put("status",r.getStatus()); m.put("matchedTokens",r.getMatchedTokens()); m.put("questionTitle",r.getQuestion()!=null?r.getQuestion().getTitle():""); m.put("detectedAt",r.getDetectedAt()); return m; }).collect(Collectors.toList()));
    }

    @PostMapping("/compare") @PreAuthorize("hasAnyRole('TEACHER','ADMIN','COMPANY')")
    public ResponseEntity<Map<String,Object>> compare(@RequestBody Map<String,String> body) { double s=plagiarismService.calculateSimilarity(body.get("code1"),body.get("code2")); return ResponseEntity.ok(Map.of("similarity",Math.round(s*100.0)/100.0,"isPlagiarized",s>=70)); }

    @PutMapping("/reports/{reportId}/status") @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long reportId, @RequestBody Map<String,String> body, @AuthenticationPrincipal User user) { plagiarismService.updateReportStatus(reportId, PlagiarismStatus.valueOf(body.get("status")), body.getOrDefault("notes",""), user); return ResponseEntity.ok(Map.of("message","Updated")); }
}
