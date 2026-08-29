package com.carbontrack.backend.service;

import com.carbontrack.backend.dto.ChallengeResponse;
import com.carbontrack.backend.entity.Challenge;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.entity.UserChallenge;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.ChallengeRepository;
import com.carbontrack.backend.repository.UserChallengeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChallengeService {

    private static final Logger log = LoggerFactory.getLogger(ChallengeService.class);

    private final ChallengeRepository     challengeRepository;
    private final UserChallengeRepository userChallengeRepository;
    private final ActivityLogRepository   activityLogRepository;
    private final SecurityService         securityService;

    public ChallengeService(ChallengeRepository challengeRepository,
                            UserChallengeRepository userChallengeRepository,
                            ActivityLogRepository activityLogRepository,
                            SecurityService securityService) {
        this.challengeRepository     = challengeRepository;
        this.userChallengeRepository = userChallengeRepository;
        this.activityLogRepository   = activityLogRepository;
        this.securityService         = securityService;
    }

    /* ── Helper: resolve current user ID ──────────────────────── */
    private Long currentUserId() {
        return securityService.getCurrentUser().getId();
    }

    /* ── Mapper ────────────────────────────────────────────────── */
    private ChallengeResponse toResponse(Challenge c, UserChallenge uc) {
        ChallengeResponse r = new ChallengeResponse();
        r.setId(c.getId());
        r.setTitle(c.getTitle());
        r.setDescription(c.getDescription());
        r.setCategory(c.getCategory());
        r.setMetricType(c.getMetricType());
        r.setTargetValue(c.getTargetValue());
        r.setXpReward(c.getXpReward());
        r.setIconKey(c.getIconKey());
        r.setPeriod(c.getPeriod());

        if (uc == null) {
            r.setStatus("NOT_JOINED");
            r.setProgressValue(0.0);
            r.setProgressPct(0.0);
        } else {
            r.setStatus(uc.getStatus() != null ? uc.getStatus() : "IN_PROGRESS");
            double progVal = uc.getProgressValue() != null ? uc.getProgressValue() : 0.0;
            r.setProgressValue(progVal);
            r.setJoinedAt(uc.getJoinedAt() != null ? uc.getJoinedAt().toString() : null);
            r.setCompletedAt(uc.getCompletedAt() != null ? uc.getCompletedAt().toString() : null);

            // Compute progress percentage
            double pct = computeProgressPct(c, progVal);
            r.setProgressPct(pct);
        }
        return r;
    }

    /**
     * Calculate progress % based on metric type.
     * For STAY_UNDER / REDUCE_EMISSIONS: 0% = at target, 100% = used none.
     * For LOG_DAYS / LOG_ENTRIES:        progressValue / targetValue * 100.
     */
    private double computeProgressPct(Challenge c, double progressValue) {
        String metric = c.getMetricType();
        double target = c.getTargetValue() != null ? c.getTargetValue() : 0.0;
        if (target <= 0) return 100.0;

        if ("LOG_DAYS".equals(metric) || "LOG_ENTRIES".equals(metric)) {
            return Math.min(100.0, (progressValue / target) * 100.0);
        }
        // STAY_UNDER / REDUCE_EMISSIONS: lower emissions = higher score
        // Show how much "room" is left: (target - used) / target * 100
        double remaining = target - progressValue;
        return Math.max(0.0, Math.min(100.0, (remaining / target) * 100.0));
    }

    /** Dynamically evaluate all joined challenges for a user against live database activity logs */
    @Transactional
    public void evaluateUserChallenges(Long userId) {
        List<UserChallenge> allJoined = userChallengeRepository.findByUserId(userId);
        for (UserChallenge uc : allJoined) {
            try {
                double progress = computeProgress(uc.getChallenge(), userId);
                uc.setProgressValue(progress);

                boolean complete = isChallengeComplete(uc.getChallenge(), progress);
                if (complete && !"COMPLETED".equals(uc.getStatus())) {
                    uc.setStatus("COMPLETED");
                    uc.setCompletedAt(LocalDate.now());
                    log.info("User {} dynamically completed challenge '{}'", userId, uc.getChallenge().getTitle());
                } else if (!complete && "COMPLETED".equals(uc.getStatus())) {
                    // Revert prematurely completed challenges back to IN_PROGRESS
                    uc.setStatus("IN_PROGRESS");
                    uc.setCompletedAt(null);
                    log.info("Reverted challenge '{}' for user {} back to IN_PROGRESS", uc.getChallenge().getTitle(), userId);
                }
                userChallengeRepository.save(uc);
            } catch (Exception e) {
                log.warn("Failed to evaluate challenge {} for user {}: {}",
                        uc.getChallenge() != null ? uc.getChallenge().getId() : null, userId, e.getMessage());
            }
        }
    }

    /** Event listener: automatically evaluate challenges when an activity is logged */
    @org.springframework.context.event.EventListener
    @Transactional
    public void handleActivityLogged(com.carbontrack.backend.event.ActivityLoggedEvent event) {
        log.info("ActivityLoggedEvent received for user {}, dynamic challenge evaluation running...", event.getUserId());
        evaluateUserChallenges(event.getUserId());
    }

    /* ── Public API ────────────────────────────────────────────── */

    /** Return all seeded challenges, annotated with the current user's status (dynamically evaluated). */
    @Transactional
    public List<ChallengeResponse> getAllChallengesForUser() {
        Long userId = currentUserId();
        evaluateUserChallenges(userId);

        User currentUser = securityService.getCurrentUser();
        Long userOrgId = (currentUser != null && currentUser.getOrganisation() != null) ? currentUser.getOrganisation().getId() : null;

        List<Challenge> all = challengeRepository.findAll().stream()
                .filter(c -> c.getOrganisationId() == null || (userOrgId != null && userOrgId.equals(c.getOrganisationId())))
                .toList();
        List<UserChallenge> joined = userChallengeRepository.findByUserId(userId);

        return all.stream().map(c -> {
            UserChallenge uc = joined.stream()
                    .filter(u -> u.getChallenge() != null && u.getChallenge().getId().equals(c.getId()))
                    .findFirst().orElse(null);
            return toResponse(c, uc);
        }).collect(Collectors.toList());
    }

    /** Return only challenges the user has joined (dynamically evaluated). */
    @Transactional
    public List<ChallengeResponse> getMyJoinedChallenges() {
        Long userId = currentUserId();
        evaluateUserChallenges(userId);

        return userChallengeRepository.findByUserId(userId).stream()
                .map(uc -> toResponse(uc.getChallenge(), uc))
                .collect(Collectors.toList());
    }

    /** Join a challenge. Idempotent — joining twice is a no-op. */
    @Transactional
    public ChallengeResponse joinChallenge(Long challengeId) {
        Long userId = currentUserId();
        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found: " + challengeId));

        Optional<UserChallenge> existing = userChallengeRepository
                .findByUserIdAndChallenge_Id(userId, challengeId);

        if (existing.isPresent()) {
            return toResponse(challenge, existing.get());
        }

        UserChallenge uc = new UserChallenge();
        uc.setUserId(userId);
        uc.setChallenge(challenge);
        uc.setStatus("IN_PROGRESS");
        uc.setProgressValue(0.0);
        uc.setJoinedAt(LocalDate.now());

        // Immediately compute initial progress
        double initialProgress = computeProgress(challenge, userId);
        uc.setProgressValue(initialProgress);
        if (isChallengeComplete(challenge, initialProgress)) {
            uc.setStatus("COMPLETED");
            uc.setCompletedAt(LocalDate.now());
        }

        userChallengeRepository.save(uc);
        return toResponse(challenge, uc);
    }

    /* ── Scheduled evaluation ──────────────────────────────────── */

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void evaluateAllActiveUserChallenges() {
        List<UserChallenge> active = userChallengeRepository.findAll().stream()
                .filter(uc -> "IN_PROGRESS".equals(uc.getStatus()))
                .collect(Collectors.toList());

        log.debug("Challenge evaluation: {} active user challenges", active.size());

        for (UserChallenge uc : active) {
            try {
                double progress = computeProgress(uc.getChallenge(), uc.getUserId());
                uc.setProgressValue(progress);

                if (isChallengeComplete(uc.getChallenge(), progress)) {
                    uc.setStatus("COMPLETED");
                    uc.setCompletedAt(LocalDate.now());
                    log.info("User {} completed challenge '{}'", uc.getUserId(), uc.getChallenge().getTitle());
                }
                userChallengeRepository.save(uc);
            } catch (Exception e) {
                log.warn("Failed to evaluate challenge {} for user {}: {}",
                        uc.getChallenge() != null ? uc.getChallenge().getId() : null, uc.getUserId(), e.getMessage());
            }
        }
    }

    /* ── Progress computation ──────────────────────────────────── */

    private double computeProgress(Challenge c, Long userId) {
        LocalDate activeStart = LocalDate.now().minusDays(30);
        LocalDate activeEnd   = LocalDate.now();

        String cat = c.getCategory();
        boolean isAll = cat == null || "all".equalsIgnoreCase(cat);

        List<com.carbontrack.backend.entity.ActivityLog> logs = activityLogRepository.findByUserIdOrderByIdDesc(userId);

        return switch (c.getMetricType() != null ? c.getMetricType() : "") {
            case "STAY_UNDER", "REDUCE_EMISSIONS" -> {
                LocalDate weekMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                Double sum = isAll ?
                        activityLogRepository.sumEmissionsByUserAndDateRange(userId, weekMonday, activeEnd) :
                        activityLogRepository.sumEmissionsByUserCategoryAndDateRange(userId, cat, weekMonday, activeEnd);
                yield sum != null ? sum : 0.0;
            }

            case "LOG_DAYS" -> {
                // Count distinct active dates where the user logged this category
                long distinctDays = logs.stream()
                        .filter(l -> l.getLogDate() != null && !l.getLogDate().isBefore(activeStart) && !l.getLogDate().isAfter(activeEnd))
                        .filter(l -> isAll || (l.getCategory() != null && l.getCategory().equalsIgnoreCase(cat)))
                        .map(com.carbontrack.backend.entity.ActivityLog::getLogDate)
                        .distinct()
                        .count();
                yield (double) distinctDays;
            }
            case "LOG_ENTRIES" -> {
                long entriesCount = logs.stream()
                        .filter(l -> l.getLogDate() != null && !l.getLogDate().isBefore(activeStart) && !l.getLogDate().isAfter(activeEnd))
                        .filter(l -> isAll || (l.getCategory() != null && l.getCategory().equalsIgnoreCase(cat)))
                        .count();
                yield (double) entriesCount;
            }
            default -> 0.0;
        };
    }

    private boolean isChallengeComplete(Challenge c, double progressValue) {
        return switch (c.getMetricType()) {
            case "STAY_UNDER", "REDUCE_EMISSIONS" -> {
                // A stay-under challenge stays IN_PROGRESS during the active week.
                // It only completes if the user has logged activity (progressValue > 0)
                // AND stayed strictly below targetValue, AND it's near the end of the week (e.g. Sunday or >= 5 days elapsed).
                LocalDate today = LocalDate.now();
                boolean endOfWeek = today.getDayOfWeek() == DayOfWeek.SUNDAY || today.getDayOfWeek() == DayOfWeek.SATURDAY;
                yield progressValue > 0 && progressValue <= c.getTargetValue() && endOfWeek;
            }
            case "LOG_DAYS", "LOG_ENTRIES" ->
                    progressValue >= c.getTargetValue();
            default -> false;
        };
    }
}
