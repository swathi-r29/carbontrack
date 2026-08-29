package com.carbontrack.backend.controller;

import com.carbontrack.backend.dto.AuthResponse;
import com.carbontrack.backend.dto.GoogleTokenRequest;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.security.JwtUtil;
import com.carbontrack.backend.service.GoogleOAuth2Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Locale;
import java.util.UUID;

/**
 * Google OAuth Authentication Controller
 * Handles Google authentication and user creation/login
 */
@RestController
@RequestMapping("/api/auth/google")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class GoogleAuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(GoogleAuthController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private GoogleOAuth2Service googleOAuth2Service;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Verify Google ID token and authenticate user
     * POST /api/auth/google/verify
     * Request body: { "token": "google_id_token_jwt" }
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyGoogleToken(@RequestBody GoogleTokenRequest request) {
        try {
            if (request.getToken() == null || request.getToken().isEmpty()) {
                return ResponseEntity.badRequest().body(
                    new AuthResponse(null, null, null, null, "Token is required", "ERROR")
                );
            }
            
            logger.info("Verifying Google ID token");
            
            // Decode the Google ID token (JWT)
            Map<String, Object> claims = googleOAuth2Service.verifyGoogleToken(request.getToken());
            
            String email = (String) claims.get("email");
            String name = (String) claims.get("name");
            if (name == null || name.isBlank()) {
                name = (String) claims.get("given_name");
                if (name == null || name.isBlank()) {
                    name = email != null ? email.substring(0, email.indexOf('@')) : "Google User";
                }
            }
            Object emailVerified = claims.get("email_verified");
            String picture = (String) claims.get("picture");
            
            // email_verified might be a boolean or string
            boolean isEmailVerified = Boolean.TRUE.equals(emailVerified) || 
                                     "true".equalsIgnoreCase(String.valueOf(emailVerified));
            
            if (email == null) {
                return ResponseEntity.badRequest().body(
                    new AuthResponse(null, null, null, null, "Google token missing required email claim", "ERROR")
                );
            }
            
            // Warn if email is not verified, but still proceed
            if (!isEmailVerified) {
                logger.warn("Google email is not verified for user: {}", email);
            }
            
            // Find existing user or create new one
            User user = userRepository.findByEmail(email)
                .orElseGet(() -> createIndividualGoogleUser(email, name, picture));
            
            // Generate JWT token
            String token = jwtUtil.generateToken(user);
            
            logger.info("Google authentication successful for user: {}", email);
            
            AuthResponse response = new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getRole(),
                "Authentication successful",
                "SUCCESS"
            );
            response.setOrganisationId(user.getOrganisation() == null ? null : user.getOrganisation().getId());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            String errorMsg = (e.getMessage() != null && !e.getMessage().isBlank()) ? e.getMessage() : e.getClass().getSimpleName();
            logger.error("Google token verification failed: {}", errorMsg, e);
            return ResponseEntity.badRequest().body(
                new AuthResponse(null, null, null, null, "Authentication failed: " + errorMsg, "ERROR")
            );
        }

    }


    private User createIndividualGoogleUser(String email, String name, String picture) {
        String localPart = email.substring(0, email.indexOf('@'))
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]", "");
        if (localPart.length() < 3) localPart = "google.user";
        String username = localPart.substring(0, Math.min(localPart.length(), 40));
        String candidate = username;
        int suffix = 1;
        while (userRepository.findByUsername(candidate).isPresent()) {
            String end = "." + suffix++;
            candidate = username.substring(0, Math.min(username.length(), 50 - end.length())) + end;
        }
        User user = new User();
        user.setUsername(candidate);
        user.setFullName(name.trim());
        user.setEmail(email.trim().toLowerCase(Locale.ROOT));
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setRole("USER");
        user.setStatus("ACTIVE");
        user.setAvatarUrl(picture);
        return userRepository.save(user);
    }

    /**
     * Handle Google OAuth callback
     * Creates or updates user and returns JWT token
     */
    @GetMapping("/callback")
    public ResponseEntity<AuthResponse> googleCallback(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.badRequest().body(
                new AuthResponse(null, null, "Google authentication failed", "ERROR")
            );
        }

        // Extract user information from Google OAuth2
        String email = principal.getAttribute("email");
        String name = principal.getAttribute("name");
        String googleId = principal.getName();

        if (email == null || name == null) {
            return ResponseEntity.badRequest().body(
                new AuthResponse(null, null, "Could not retrieve user information", "ERROR")
            );
        }

        // Organisation selection is mandatory; OAuth is login-only.
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException(
                "Register with an organisation before using Google sign-in"));

        // Generate JWT token
        String token = jwtUtil.generateToken(user);

        return ResponseEntity.ok(new AuthResponse(
            token,
            user.getId(),
            user.getUsername(),
            user.getRole()
        ));
    }

    /**
     * Get current authenticated user info
     */
    @GetMapping("/user")
    public ResponseEntity<AuthResponse> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.badRequest().body(
                new AuthResponse(null, null, "Not authenticated", "ERROR")
            );
        }

        String email = principal.getAttribute("email");
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        String token = jwtUtil.generateToken(user);

        return ResponseEntity.ok(new AuthResponse(
            token,
            user.getId(),
            user.getUsername(),
            user.getRole()
        ));
    }
}
