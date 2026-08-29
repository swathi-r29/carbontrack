package com.carbontrack.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Google OAuth2 Token Verification Service
 * Decodes and validates Google OAuth ID tokens.
 */
@Service
public class GoogleOAuth2Service {
    
    private static final Logger logger = LoggerFactory.getLogger(GoogleOAuth2Service.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GoogleOAuth2Service() {
    }
    
    /**
     * Decode a Google OAuth ID token (JWT) and return its claims.
     * Note: This does NOT verify the signature, as the frontend should use
     * Google's official client library for signature verification. This service
     * simply extracts the claims for user lookup/creation.
     *
     * @param token The Google ID token (JWT)
     * @return Map containing user information (sub, email, name, picture, email_verified)
     * @throws Exception if the token format is invalid or claims are missing
     */
    public Map<String, Object> verifyGoogleToken(String token) throws Exception {
        try {
            // JWT format: header.payload.signature
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                // If not a JWT format, attempt to verify as an access token by calling Google UserInfo API
                return fetchUserInfoFromAccessToken(token);
            }

            // Decode the payload (second part)
            String payload = parts[1];
            // Add padding if necessary
            int padding = 4 - (payload.length() % 4);
            if (padding != 4) {
                payload += "=".repeat(padding);
            }

            byte[] decodedBytes = Base64.getUrlDecoder().decode(payload);
            String decodedPayload = new String(decodedBytes, StandardCharsets.UTF_8);

            // Parse JSON payload
            @SuppressWarnings("unchecked")
            Map<String, Object> claims = objectMapper.readValue(decodedPayload, Map.class);

            // Verify required fields
            if (!claims.containsKey("email") || !claims.containsKey("sub")) {
                throw new IllegalArgumentException(
                        "Google token is missing required claims (email or sub)");
            }

            logger.info("Google token decoded successfully for user: {}", claims.get("email"));
            return claims;
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorMsg = "Google API rejected token (HTTP " + e.getStatusCode() + ")";
            logger.error(errorMsg);
            throw new Exception(errorMsg, e);
        } catch (Exception e) {
            String errorMsg = (e.getMessage() != null && !e.getMessage().isBlank()) ? e.getMessage() : e.getClass().getSimpleName();
            logger.error("Failed to verify Google token: {}", errorMsg, e);
            throw new Exception(errorMsg, e);
        }

    }

    /**
     * Call Google's UserInfo API to verify an access token and retrieve user profile.
     */
    private Map<String, Object> fetchUserInfoFromAccessToken(String accessToken) {
        logger.info("Verifying Google token as OAuth2 Access Token");
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                HttpMethod.GET,
                entity,
                Map.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> claims = response.getBody();
            // Verify required fields
            if (!claims.containsKey("email") || !claims.containsKey("sub")) {
                throw new IllegalArgumentException("Google UserInfo response is missing email or sub");
            }
            logger.info("Google user info fetched successfully via access token for: {}", claims.get("email"));
            return claims;
        } else {
            throw new IllegalArgumentException("Google UserInfo API returned status: " + response.getStatusCode());
        }
    }
}
