package com.codecampus.controller;

import com.codecampus.model.CodingTest;
import com.codecampus.repository.CodingTestRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Internal endpoints consumed only by proctoring-service and other microservices.
 * Not exposed externally via the Gateway.
 */
@RestController
@RequestMapping("/internal/tests")
public class InternalTestController {

    private final CodingTestRepository codingTestRepository;

    public InternalTestController(CodingTestRepository codingTestRepository) {
        this.codingTestRepository = codingTestRepository;
    }

    @GetMapping("/{id}/settings")
    public ResponseEntity<Map<String, Object>> getTestSettings(@PathVariable Long id) {
        return codingTestRepository.findById(id).map(t -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("maxTabSwitches", t.getMaxTabSwitches());
            m.put("proctoringEnabled", t.isProctoringEnabled());
            m.put("cameraRequired", t.isCameraRequired());
            m.put("fullscreenRequired", t.isFullscreenRequired());
            m.put("snapshotIntervalSeconds", t.getSnapshotIntervalSeconds());
            m.put("currentlyActive", t.isCurrentlyActive());
            return ResponseEntity.ok(m);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTest(@PathVariable Long id) {
        return codingTestRepository.findById(id).map(t -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("title", t.getTitle());
            m.put("totalMarks", t.getTotalMarks());
            m.put("maxTabSwitches", t.getMaxTabSwitches());
            m.put("proctoringEnabled", t.isProctoringEnabled());
            m.put("currentlyActive", t.isCurrentlyActive());
            if (t.getCreatedBy() != null) {
                m.put("createdById", t.getCreatedBy().getId());
                m.put("createdByName", t.getCreatedBy().getFullName());
            }
            return ResponseEntity.ok(m);
        }).orElse(ResponseEntity.notFound().build());
    }
}
