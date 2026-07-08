package com.codecampus.dto;

import com.codecampus.model.Role;

public class AuthResponse {
    private String token;
    private String username;
    private String fullName;
    private String email;
    private Role role;
    private Long userId;

    public AuthResponse() {}
    public AuthResponse(String token, String username, String fullName, String email, Role role, Long userId) {
        this.token = token; this.username = username; this.fullName = fullName;
        this.email = email; this.role = role; this.userId = userId;
    }
    public String getToken() { return token; }
    public String getUsername() { return username; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public Role getRole() { return role; }
    public Long getUserId() { return userId; }

    public static ARBuilder builder() { return new ARBuilder(); }
    public static class ARBuilder {
        private String token, username, fullName, email;
        private Role role;
        private Long userId;
        public ARBuilder token(String v) { this.token = v; return this; }
        public ARBuilder username(String v) { this.username = v; return this; }
        public ARBuilder fullName(String v) { this.fullName = v; return this; }
        public ARBuilder email(String v) { this.email = v; return this; }
        public ARBuilder role(Role v) { this.role = v; return this; }
        public ARBuilder userId(Long v) { this.userId = v; return this; }
        public AuthResponse build() { return new AuthResponse(token, username, fullName, email, role, userId); }
    }
}
