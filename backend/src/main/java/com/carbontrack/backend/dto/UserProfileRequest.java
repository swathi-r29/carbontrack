package com.carbontrack.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserProfileRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    private SustainabilityPreferences sustainabilityPreferences;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    private Boolean isAnonymous;

    public Boolean getIsAnonymous() { return isAnonymous; }
    public void setIsAnonymous(Boolean isAnonymous) { this.isAnonymous = isAnonymous; }

    @Size(max = 50, message = "Anonymous display name cannot exceed 50 characters")
    private String anonymousName;

    public String getAnonymousName() { return anonymousName; }
    public void setAnonymousName(String anonymousName) { this.anonymousName = anonymousName; }

    private Long organisationId;

    public Long getOrganisationId() { return organisationId; }
    public void setOrganisationId(Long organisationId) { this.organisationId = organisationId; }

    public SustainabilityPreferences getSustainabilityPreferences() { return sustainabilityPreferences; }
    public void setSustainabilityPreferences(SustainabilityPreferences sustainabilityPreferences) { 
        this.sustainabilityPreferences = sustainabilityPreferences; 
    }
}

