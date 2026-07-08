package com.codecampus.controller;

import com.codecampus.dto.CodingTestDTO;
import com.codecampus.model.*;
import com.codecampus.repository.*;
import com.codecampus.service.CodingTestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/company")
@PreAuthorize("hasAnyRole('COMPANY','ADMIN')")
public class CompanyController {
    private final CodingTestService codingTestService;
    private final CodingTestRepository codingTestRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;

    public CompanyController(CodingTestService codingTestService, CodingTestRepository codingTestRepository, SubmissionRepository submissionRepository, UserRepository userRepository, QuestionRepository questionRepository) {
        this.codingTestService = codingTestService; this.codingTestRepository = codingTestRepository; this.submissionRepository = submissionRepository; this.userRepository = userRepository; this.questionRepository = questionRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String,Object>> getDashboard(@AuthenticationPrincipal User user) {
        Map<String,Object> s = new HashMap<>(); List<CodingTest> tests = codingTestRepository.findByCreatedById(user.getId());
        s.put("totalHiringTests", tests.size()); s.put("activeTests", tests.stream().filter(CodingTest::isCurrentlyActive).count()); s.put("companyName", user.getCompanyName());
        long cands = 0; for (CodingTest t : tests) cands += submissionRepository.findByCodingTestId(t.getId()).stream().map(sub -> sub.getUser().getId()).distinct().count();
        s.put("totalCandidates", cands); s.put("totalQuestions", questionRepository.findByCreatedById(user.getId()).size());
        return ResponseEntity.ok(s);
    }

    @PostMapping("/hiring-test")
    public ResponseEntity<CodingTestDTO> createHiringTest(@RequestBody CodingTestDTO dto, @AuthenticationPrincipal User user) { dto.setTestType("HIRING"); return ResponseEntity.ok(codingTestService.createTest(dto, user)); }

    @GetMapping("/hiring-tests")
    public ResponseEntity<List<CodingTestDTO>> getMyTests(@AuthenticationPrincipal User user) { return ResponseEntity.ok(codingTestService.getTestsByTeacher(user.getId())); }

    @GetMapping("/hiring-test/{testId}/candidates")
    public ResponseEntity<List<Map<String,Object>>> getCandidates(@PathVariable Long testId) {
        Map<Long, List<Submission>> byUser = submissionRepository.findByCodingTestId(testId).stream().collect(Collectors.groupingBy(s -> s.getUser().getId()));
        return ResponseEntity.ok(byUser.entrySet().stream().map(e -> { List<Submission> subs = e.getValue(); User c = subs.get(0).getUser(); Map<String,Object> m = new HashMap<>(); m.put("userId",c.getId()); m.put("fullName",c.getFullName()); m.put("email",c.getEmail()); m.put("username",c.getUsername()); int ts=subs.stream().mapToInt(Submission::getScore).sum(), ms=subs.size()*100; m.put("totalScore",ts); m.put("maxScore",ms); m.put("percentage",ms>0?ts*100/ms:0); m.put("testCasesPassed",subs.stream().mapToInt(Submission::getTestCasesPassed).sum()); m.put("totalTestCases",subs.stream().mapToInt(Submission::getTotalTestCases).sum()); m.put("questionsAttempted",subs.size()); m.put("status",ts>=ms*0.6?"SHORTLISTED":"PENDING"); return m; }).sorted((a,b)->(int)b.get("totalScore")-(int)a.get("totalScore")).collect(Collectors.toList()));
    }
}
