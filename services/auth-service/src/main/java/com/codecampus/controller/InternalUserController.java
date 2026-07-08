package com.codecampus.controller;

import com.codecampus.model.User;
import com.codecampus.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Internal endpoint consumed only by other microservices (not exposed externally).
 * The API Gateway does NOT route /internal/** from the internet.
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
        return userRepository.findById(id)
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("fullName", u.getFullName());
                    m.put("email", u.getEmail());
                    m.put("role", u.getRole().name());
                    m.put("systemId", u.getSystemId());
                    return ResponseEntity.ok(m);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users/username/{username}")
    public ResponseEntity<Map<String, Object>> getUserByUsername(@PathVariable String username) {
        return userRepository.findByUsername(username)
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("fullName", u.getFullName());
                    m.put("email", u.getEmail());
                    m.put("role", u.getRole().name());
                    return ResponseEntity.ok(m);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
