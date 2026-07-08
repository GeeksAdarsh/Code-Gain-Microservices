package com.codecampus.service;

import com.codecampus.model.*;
import com.codecampus.repository.CodingTestRepository;
import com.codecampus.repository.ProctoringLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProctoringService {
    private static final Logger log = LoggerFactory.getLogger(ProctoringService.class);
    private final ProctoringLogRepository proctoringLogRepository;
    private final CodingTestRepository codingTestRepository;

    public ProctoringService(ProctoringLogRepository proctoringLogRepository, CodingTestRepository codingTestRepository) {
        this.proctoringLogRepository = proctoringLogRepository; this.codingTestRepository = codingTestRepository;
    }

    public ProctoringLog logEvent(Long testId, User user, ProctoringEventType eventType, String details, String snapshot) {
        CodingTest test = codingTestRepository.findById(testId).orElseThrow();
        ProctoringLog entry = ProctoringLog.builder().user(user).codingTest(test).eventType(eventType).details(details).snapshot(snapshot).flagged(isSuspicious(eventType)).build();
        if (eventType == ProctoringEventType.TAB_SWITCH) { int c = proctoringLogRepository.countTabSwitches(user.getId(), testId) + 1; entry.setTabSwitchCount(c); entry.setDetails("Tab switch #" + c); if (c >= test.getMaxTabSwitches()) { entry.setFlagged(true); entry.setDetails("Tab limit exceeded — AUTO SUBMIT"); } }
        if (eventType == ProctoringEventType.FULLSCREEN_EXIT) { entry.setFullscreenExited(true); entry.setFlagged(true); }
        ProctoringLog saved = proctoringLogRepository.save(entry);
        if (entry.isFlagged()) log.warn("🚨 {} by {} on test {}", eventType, user.getUsername(), testId);
        return saved;
    }

    public Map<String, Object> getStudentProctoringReport(Long testId, Long userId) {
        List<ProctoringLog> logs = proctoringLogRepository.findByUserIdAndCodingTestId(userId, testId);
        Map<String, Object> r = new HashMap<>();
        r.put("totalEvents", logs.size());
        r.put("tabSwitches", logs.stream().filter(l -> l.getEventType() == ProctoringEventType.TAB_SWITCH).count());
        r.put("flaggedEvents", logs.stream().filter(ProctoringLog::isFlagged).count());
        int trust = 100; trust -= (int)logs.stream().filter(l->l.getEventType()==ProctoringEventType.TAB_SWITCH).count()*10; trust -= (int)logs.stream().filter(l->l.getEventType()==ProctoringEventType.FULLSCREEN_EXIT).count()*15; trust -= (int)logs.stream().filter(l->l.getEventType()==ProctoringEventType.COPY_PASTE_DETECTED).count()*20; r.put("trustScore", Math.max(0, trust));
        r.put("events", logs.stream().map(l -> { Map<String,Object> e=new HashMap<>(); e.put("type",l.getEventType().name()); e.put("details",l.getDetails()); e.put("flagged",l.isFlagged()); e.put("timestamp",l.getTimestamp()); return e; }).collect(Collectors.toList()));
        return r;
    }

    public List<Map<String, Object>> getTestProctoringOverview(Long testId) {
        Map<Long, List<ProctoringLog>> byUser = proctoringLogRepository.findByCodingTestId(testId).stream().collect(Collectors.groupingBy(l -> l.getUser().getId()));
        List<Map<String, Object>> overview = new ArrayList<>();
        for (var entry : byUser.entrySet()) {
            List<ProctoringLog> ul = entry.getValue(); User u = ul.get(0).getUser();
            Map<String, Object> sr = new HashMap<>(); sr.put("userId", u.getId()); sr.put("username", u.getUsername()); sr.put("fullName", u.getFullName());
            sr.put("tabSwitches", ul.stream().filter(l->l.getEventType()==ProctoringEventType.TAB_SWITCH).count()); sr.put("flaggedCount", ul.stream().filter(ProctoringLog::isFlagged).count());
            int trust=100; trust-=(int)ul.stream().filter(l->l.getEventType()==ProctoringEventType.TAB_SWITCH).count()*10; trust-=(int)ul.stream().filter(l->l.getEventType()==ProctoringEventType.FULLSCREEN_EXIT).count()*15; sr.put("trustScore", Math.max(0,trust)); overview.add(sr);
        }
        overview.sort((a,b) -> (int)a.get("trustScore") - (int)b.get("trustScore")); return overview;
    }

    public boolean shouldAutoSubmit(Long testId, Long userId) { CodingTest t=codingTestRepository.findById(testId).orElse(null); return t!=null && proctoringLogRepository.countTabSwitches(userId,testId)>=t.getMaxTabSwitches(); }
    private boolean isSuspicious(ProctoringEventType e) { return e==ProctoringEventType.TAB_SWITCH||e==ProctoringEventType.FULLSCREEN_EXIT||e==ProctoringEventType.COPY_PASTE_DETECTED||e==ProctoringEventType.CAMERA_BLOCKED||e==ProctoringEventType.MULTIPLE_FACES_DETECTED||e==ProctoringEventType.NO_FACE_DETECTED||e==ProctoringEventType.SUSPICIOUS_ACTIVITY; }
}
