package com.codecampus.controller;

import com.codecampus.model.User;
import com.codecampus.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Internal endpoint — consumed only by other microservices (not exposed via Gateway).
 */
@RestController
@RequestMapping("/internal")
public class InternalUserController {

    private final UserRepository userRepository;

    public InternalUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable Long id) {
        return userRepository.findById(id).map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("fullName", u.getFullName());
            m.put("email", u.getEmail());
            m.put("role", u.getRole().name());
            m.put("systemId", u.getSystemId());
            m.put("enabled", u.isEnabled());
            if (u.getSection() != null) {
                m.put("sectionId", u.getSection().getId());
                m.put("sectionName", u.getSection().getName());
            }
            if (u.getBatch() != null) {
                m.put("batchId", u.getBatch().getId());
                m.put("batchName", u.getBatch().getName());
            }
            return ResponseEntity.ok(m);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users/email/{email}")
    public ResponseEntity<Map<String, Object>> getUserByEmail(@PathVariable String email) {
        return userRepository.findByEmail(email).map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("fullName", u.getFullName());
            m.put("email", u.getEmail());
            m.put("role", u.getRole().name());
            return ResponseEntity.ok(m);
        }).orElse(ResponseEntity.notFound().build());
    }
}
