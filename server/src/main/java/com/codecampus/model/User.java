package com.codecampus.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Column(unique = true)
    private String username;

    @NotBlank
    private String password;

    @NotBlank
    private String fullName;

    @Email @NotBlank @Column(unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String department;
    private String enrollmentNumber;
    private String systemId;
    private String track;
    private String mobileNumber;
    private String program;
    @Column(columnDefinition = "MEDIUMTEXT")
    private String profileImage;
    private boolean isDebarred = false;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id")
    private Batch batch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "section_id")
    private Section section;
    @Column(columnDefinition = "TEXT")
    private String bio;
    private String githubUrl;
    private String linkedinUrl;
    private String twitterUrl;
    private String websiteUrl;
    private String location;
    private String university;
    private String companyName;
    private String companyWebsite;
    private String companyLogo;
    @Column(columnDefinition = "TEXT")
    private String companyDescription;
    private String industry;
    private boolean enabled = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User() {}

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getEnrollmentNumber() { return enrollmentNumber; }
    public void setEnrollmentNumber(String enrollmentNumber) { this.enrollmentNumber = enrollmentNumber; }
    public String getSystemId() { return systemId; }
    public void setSystemId(String systemId) { this.systemId = systemId; }
    public String getTrack() { return track; }
    public void setTrack(String track) { this.track = track; }
    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }
    public String getProgram() { return program; }
    public void setProgram(String program) { this.program = program; }
    public boolean isDebarred() { return isDebarred; }
    public void setDebarred(boolean v) { this.isDebarred = v; }
    public Batch getBatch() { return batch; }
    public void setBatch(Batch batch) { this.batch = batch; }
    public Section getSection() { return section; }
    public void setSection(Section section) { this.section = section; }
    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getCompanyWebsite() { return companyWebsite; }
    public void setCompanyWebsite(String companyWebsite) { this.companyWebsite = companyWebsite; }
    public String getCompanyLogo() { return companyLogo; }
    public void setCompanyLogo(String companyLogo) { this.companyLogo = companyLogo; }
    public String getCompanyDescription() { return companyDescription; }
    public void setCompanyDescription(String companyDescription) { this.companyDescription = companyDescription; }
    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getGithubUrl() { return githubUrl; }
    public void setGithubUrl(String v) { this.githubUrl = v; }
    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String v) { this.linkedinUrl = v; }
    public String getTwitterUrl() { return twitterUrl; }
    public void setTwitterUrl(String v) { this.twitterUrl = v; }
    public String getWebsiteUrl() { return websiteUrl; }
    public void setWebsiteUrl(String v) { this.websiteUrl = v; }
    public String getLocation() { return location; }
    public void setLocation(String v) { this.location = v; }
    public String getUniversity() { return university; }
    public void setUniversity(String v) { this.university = v; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // --- UserDetails ---
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(new SimpleGrantedAuthority("ROLE_" + role.name())); }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }

    // --- Builder ---
    public static UserBuilder builder() { return new UserBuilder(); }

    public static class UserBuilder {
        private final User u = new User();
        public UserBuilder username(String v) { u.username = v; return this; }
        public UserBuilder password(String v) { u.password = v; return this; }
        public UserBuilder fullName(String v) { u.fullName = v; return this; }
        public UserBuilder email(String v) { u.email = v; return this; }
        public UserBuilder role(Role v) { u.role = v; return this; }
        public UserBuilder department(String v) { u.department = v; return this; }
        public UserBuilder enrollmentNumber(String v) { u.enrollmentNumber = v; return this; }
        public UserBuilder systemId(String v) { u.systemId = v; return this; }
        public UserBuilder track(String v) { u.track = v; return this; }
        public UserBuilder mobileNumber(String v) { u.mobileNumber = v; return this; }
        public UserBuilder program(String v) { u.program = v; return this; }
        public UserBuilder batch(Batch v) { u.batch = v; return this; }
        public UserBuilder section(Section v) { u.section = v; return this; }
        public UserBuilder isDebarred(boolean v) { u.isDebarred = v; return this; }
        public UserBuilder profileImage(String v) { u.profileImage = v; return this; }
        public UserBuilder companyName(String v) { u.companyName = v; return this; }
        public UserBuilder companyWebsite(String v) { u.companyWebsite = v; return this; }
        public UserBuilder companyDescription(String v) { u.companyDescription = v; return this; }
        public UserBuilder industry(String v) { u.industry = v; return this; }
        public UserBuilder bio(String v) { u.bio = v; return this; }
        public UserBuilder githubUrl(String v) { u.githubUrl = v; return this; }
        public UserBuilder linkedinUrl(String v) { u.linkedinUrl = v; return this; }
        public UserBuilder twitterUrl(String v) { u.twitterUrl = v; return this; }
        public UserBuilder websiteUrl(String v) { u.websiteUrl = v; return this; }
        public UserBuilder location(String v) { u.location = v; return this; }
        public UserBuilder university(String v) { u.university = v; return this; }
        public UserBuilder enabled(boolean v) { u.enabled = v; return this; }
        public User build() { return u; }
    }
}
