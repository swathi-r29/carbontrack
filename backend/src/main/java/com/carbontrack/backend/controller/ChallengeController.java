package com.carbontrack.backend.controller;

import com.carbontrack.backend.dto.ChallengeResponse;
import com.carbontrack.backend.service.ChallengeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.List;

/**
 * ChallengeController — REST endpoints for the Eco Challenge System.
 *
 * All endpoints require a valid JWT.
 *
 * GET  /api/challenges        → all challenges with current user's status
 * GET  /api/challenges/my     → only challenges the user has joined
 * POST /api/challenges/{id}/join → join (or re-fetch) a challenge
 */
@RestController
@RequestMapping("/api/challenges")
public class ChallengeController {

    private static final Logger log = LoggerFactory.getLogger(ChallengeController.class);

    private final ChallengeService challengeService;

    public ChallengeController(ChallengeService challengeService) {
        this.challengeService = challengeService;
    }

    @GetMapping
    public ResponseEntity<List<ChallengeResponse>> getAllChallenges() {
        try {
            return ResponseEntity.ok(challengeService.getAllChallengesForUser());
        } catch (Exception e) {
            log.error("Failed to fetch challenges for user: {}", e.getMessage(), e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<ChallengeResponse>> getMyChallenges() {
        try {
            return ResponseEntity.ok(challengeService.getMyJoinedChallenges());
        } catch (Exception e) {
            log.error("Failed to fetch joined challenges for user: {}", e.getMessage(), e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ChallengeResponse> joinChallenge(@PathVariable Long id) {
        return ResponseEntity.ok(challengeService.joinChallenge(id));
    }
}

