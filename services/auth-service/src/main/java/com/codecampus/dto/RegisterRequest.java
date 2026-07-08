package com.codecampus.dto;

import com.codecampus.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank @Size(min = 3, max = 50) private String username;
    @NotBlank @Size(min = 6) private String password;
    @NotBlank private String fullName;
    @Email @NotBlank private String email;
    private Role role = Role.STUDENT;
    private String department;
    private String enrollmentNumber;
    private Long sectionId;
    private String companyName;
    private String companyWebsite;
    private String companyDescription;
    private String industry;

    public RegisterRequest() {}
    public String getUsername() { return username; }
    public void setUsername(String v) { this.username = v; }
    public String getPassword() { return password; }
    public void setPassword(String v) { this.password = v; }
    public String getFullName() { return fullName; }
    public void setFullName(String v) { this.fullName = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public Role getRole() { return role; }
    public void setRole(Role v) { this.role = v; }
    public String getDepartment() { return department; }
    public void setDepartment(String v) { this.department = v; }
    public String getEnrollmentNumber() { return enrollmentNumber; }
    public void setEnrollmentNumber(String v) { this.enrollmentNumber = v; }
    public Long getSectionId() { return sectionId; }
    public void setSectionId(Long v) { this.sectionId = v; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String v) { this.companyName = v; }
    public String getCompanyWebsite() { return companyWebsite; }
    public void setCompanyWebsite(String v) { this.companyWebsite = v; }
    public String getCompanyDescription() { return companyDescription; }
    public void setCompanyDescription(String v) { this.companyDescription = v; }
    public String getIndustry() { return industry; }
    public void setIndustry(String v) { this.industry = v; }
}
