package com.codecampus.shared.dto;

/**
 * Lightweight user identity built from gateway-injected HTTP headers.
 * Every microservice reads these headers instead of querying the DB.
 */
public class UserPrincipal {
    private final Long userId;
    private final String username;
    private final String role;

    public UserPrincipal(Long userId, String username, String role) {
        this.userId = userId;
        this.username = username;
        this.role = role;
    }

    public Long getUserId()   { return userId; }
    public String getUsername() { return username; }
    public String getRole()   { return role; }

    public boolean isAdmin()   { return "ADMIN".equals(role); }
    public boolean isTeacher() { return "TEACHER".equals(role) || "ADMIN".equals(role); }
    public boolean isStudent() { return "STUDENT".equals(role); }
    public boolean isCompany() { return "COMPANY".equals(role); }
}
