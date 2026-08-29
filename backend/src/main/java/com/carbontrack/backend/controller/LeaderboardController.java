package com.carbontrack.backend.controller;

import com.carbontrack.backend.dto.DailyTrendDto;
import com.carbontrack.backend.dto.LeaderboardResponse;
import com.carbontrack.backend.dto.LeaderboardUserResponse;
import com.carbontrack.backend.dto.RecentAchievementDto;
import com.carbontrack.backend.entity.ActivityLog;
import com.carbontrack.backend.entity.Badge;
import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.entity.UserBadge;
import com.carbontrack.backend.repository.ActivityLogRepository;
import com.carbontrack.backend.repository.BadgeRepository;
import com.carbontrack.backend.repository.ChallengeRepository;
import com.carbontrack.backend.repository.GoalRepository;
import com.carbontrack.backend.repository.UserBadgeRepository;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.SecurityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private static final Logger log = LoggerFactory.getLogger(LeaderboardController.class);

    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final BadgeRepository badgeRepository;
    private final GoalRepository goalRepository;
    private final ChallengeRepository challengeRepository;
    private final SecurityService securityService;

    public LeaderboardController(UserRepository userRepository,
                                 ActivityLogRepository activityLogRepository,
                                 UserBadgeRepository userBadgeRepository,
                                 BadgeRepository badgeRepository,
                                 GoalRepository goalRepository,
                                 ChallengeRepository challengeRepository,
                                 SecurityService securityService) {
        this.userRepository = userRepository;
        this.activityLogRepository = activityLogRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.badgeRepository = badgeRepository;
        this.goalRepository = goalRepository;
        this.challengeRepository = challengeRepository;
        this.securityService = securityService;
    }

    @GetMapping
    public ResponseEntity<LeaderboardResponse> getLeaderboard() {
        try {
            return ResponseEntity.ok(buildLeaderboardResponse(null, 50));
        } catch (Exception e) {
            log.error("Failed to load leaderboard: {}", e.getMessage(), e);
            return ResponseEntity.ok(new LeaderboardResponse(
                    Collections.emptyList(),
                    Collections.emptyList(),
                    null,
                    System.currentTimeMillis() / 1000L,
                    0, 0.0, 0, 0,
                    Collections.emptyList(),
                    Collections.emptyList()
            ));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<LeaderboardResponse> searchLeaderboard(@RequestParam("q") String query,
                                                                 @RequestParam(value = "limit", defaultValue = "50") int limit) {
        try {
            return ResponseEntity.ok(buildLeaderboardResponse(query, limit));
        } catch (Exception e) {
            log.error("Failed to search leaderboard: {}", e.getMessage(), e);
            return ResponseEntity.ok(new LeaderboardResponse(
                    Collections.emptyList(),
                    Collections.emptyList(),
                    null,
                    System.currentTimeMillis() / 1000L,
                    0, 0.0, 0, 0,
                    Collections.emptyList(),
                    Collections.emptyList()
            ));
        }
    }


    private LeaderboardResponse buildLeaderboardResponse(String searchQuery, int limit) {
        User currentUser = securityService.getCurrentUser();
        List<LeaderboardUserResponse> rankedUsers = calculateLeaderboard(currentUser.getId());
        String normalisedQuery = searchQuery == null ? "" : searchQuery.trim().toLowerCase(Locale.ROOT);
        List<LeaderboardUserResponse> list = rankedUsers.stream()
                .filter(user -> normalisedQuery.isEmpty()
                        || (user.getUsername() != null
                        && user.getUsername().toLowerCase(Locale.ROOT).contains(normalisedQuery)))
                .collect(Collectors.toList());

        // top three
        List<LeaderboardUserResponse> topThree = list.stream()
                .limit(3)
                .collect(Collectors.toList());

        // all (filtered and limited)
        List<LeaderboardUserResponse> all = list.stream()
                .limit(limit)
                .collect(Collectors.toList());

        // current user
        LeaderboardUserResponse curUserResp = list.stream()
                .filter(u -> u.getUserId().equals(currentUser.getId()))
                .findFirst()
                .orElse(null);

        // 100% Strict Dynamic Community Metrics from Database
        List<User> validUsers = userRepository.findAll().stream()
                .filter(u -> {
                    String un = u.getUsername() != null ? u.getUsername().toLowerCase() : "";
                    String em = u.getEmail() != null ? u.getEmail().toLowerCase() : "";
                    String role = u.getRole() != null ? u.getRole().toUpperCase() : "";
                    return !un.contains("test") && !em.contains("test")
                            && !role.equals("ADMIN") && !role.equals("ORG_ADMIN");
                })
                .collect(Collectors.toList());

        long totalCommunityMembers = validUsers.size();

        List<ActivityLog> allLogs = activityLogRepository.findAll();
        double totalCO2Saved = allLogs.stream()
                .mapToDouble(l -> l.getCalculatedEmissions() != null ? l.getCalculatedEmissions() : 0.0)
                .sum();

        LocalDate today = LocalDate.now();
        long activitiesLoggedToday = allLogs.stream()
                .filter(log -> log.getLogDate() == null || log.getLogDate().equals(today))
                .count();

        long activeChallenges = challengeRepository.count();

        // Build Dynamic Recent Achievements Stream (100% Real Database Events)
        List<RecentAchievementDto> recentAchievements = buildRecentAchievements(validUsers, allLogs);

        // Build Dynamic 7-Day Trend Chart Data
        List<DailyTrendDto> dailyTrends = buildDailyTrends(allLogs);

        return new LeaderboardResponse(
                topThree,
                all,
                curUserResp,
                System.currentTimeMillis() / 1000L,
                totalCommunityMembers,
                totalCO2Saved,
                activitiesLoggedToday,
                activeChallenges,
                recentAchievements,
                dailyTrends
        );
    }

    private List<RecentAchievementDto> buildRecentAchievements(List<User> validUsers, List<ActivityLog> allLogs) {
        User currentUser = securityService.getCurrentUser();
        List<RecentAchievementDto> list = new ArrayList<>();
        Map<Long, String> userNameMap = new HashMap<>();
        for (User u : validUsers) {
            boolean isSelf = u.getId().equals(currentUser.getId());
            if (u.getIsAnonymous() != null && u.getIsAnonymous() && !isSelf) {
                userNameMap.put(u.getId(), "Anonymous User #" + (u.getId() % 10000));
            } else {
                userNameMap.put(u.getId(), u.getUsername());
            }
        }

        LocalDate today = LocalDate.now();

        // 1. Add Recent Activity Logs (Most recent first)
        List<ActivityLog> sortedLogs = new ArrayList<>(allLogs);
        sortedLogs.sort((a, b) -> Long.compare(b.getId(), a.getId()));

        for (ActivityLog log : sortedLogs) {
            if (list.size() >= 6) break;
            String username = userNameMap.get(log.getUserId());
            if (username != null) {
                String cat = log.getCategory() != null ? log.getCategory().toLowerCase() : "activity";
                String detail = String.format("%s (%.1f kg CO₂e)", log.getActivityType() != null ? log.getActivityType() : "Eco Log", log.getCalculatedEmissions() != null ? log.getCalculatedEmissions() : 0.0);
                
                String timeAgo = "Today";
                if (log.getLogDate() != null) {
                    long days = ChronoUnit.DAYS.between(log.getLogDate(), today);
                    if (days <= 0) timeAgo = "Today";
                    else if (days == 1) timeAgo = "Yesterday";
                    else timeAgo = days + "d ago";
                }

                list.add(new RecentAchievementDto(
                        log.getId(),
                        username,
                        "logged " + cat,
                        detail,
                        "activity",
                        timeAgo
                ));
            }
        }

        // 2. Add Recent User Badges if space permits
        if (list.size() < 6) {
            List<UserBadge> allUserBadges = userBadgeRepository.findAll();
            List<Badge> allBadges = badgeRepository.findAll();
            Map<Long, String> badgeNameMap = allBadges.stream()
                    .collect(Collectors.toMap(Badge::getId, Badge::getName, (a, b) -> a));

            for (int i = allUserBadges.size() - 1; i >= 0 && list.size() < 6; i--) {
                UserBadge ub = allUserBadges.get(i);
                String uName = userNameMap.get(ub.getUserId());
                String bName = badgeNameMap.get(ub.getBadgeId());
                if (uName != null && bName != null) {
                    list.add(new RecentAchievementDto(
                            ub.getId(),
                            uName,
                            "unlocked badge",
                            bName,
                            "badge",
                            "Recent"
                    ));
                }
            }
        }

        // 3. Add Recent Member Registrations if space permits
        if (list.size() < 6) {
            for (int i = validUsers.size() - 1; i >= 0 && list.size() < 6; i--) {
                User u = validUsers.get(i);
                list.add(new RecentAchievementDto(
                        u.getId(),
                        u.getUsername(),
                        "joined community",
                        "Welcome new member",
                        "join",
                        "Recent"
                ));
            }
        }

        return list;
    }

    private List<DailyTrendDto> buildDailyTrends(List<ActivityLog> allLogs) {
        List<DailyTrendDto> trends = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dayName = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            List<ActivityLog> dayLogs = allLogs.stream()
                    .filter(log -> log.getLogDate() != null && log.getLogDate().equals(date))
                    .collect(Collectors.toList());

            double dayCO2 = dayLogs.stream()
                    .mapToDouble(l -> l.getCalculatedEmissions() != null ? l.getCalculatedEmissions() : 0.0)
                    .sum();
            long dayCount = dayLogs.size();

            trends.add(new DailyTrendDto(dayName, dayCO2, dayCount));
        }

        return trends;
    }

    private List<LeaderboardUserResponse> calculateLeaderboard(Long currentUserId) {
        List<User> users = userRepository.findAll();
        List<ActivityLog> allLogs = activityLogRepository.findAll();
        List<UserBadge> allUserBadges = userBadgeRepository.findAll();
        List<Badge> allBadges = badgeRepository.findAll();

        Map<Long, List<ActivityLog>> logsByUser = allLogs.stream()
                .collect(Collectors.groupingBy(ActivityLog::getUserId));

        Map<Long, List<UserBadge>> userBadgesByUser = allUserBadges.stream()
                .collect(Collectors.groupingBy(UserBadge::getUserId));

        Map<Long, Badge> badgeMap = allBadges.stream()
                .collect(Collectors.toMap(Badge::getId, b -> b));

        List<LeaderboardUserResponse> responseList = new ArrayList<>();

        for (User user : users) {
             String usernameLower = user.getUsername() != null ? user.getUsername().toLowerCase() : "";
             String emailLower = user.getEmail() != null ? user.getEmail().toLowerCase() : "";
             String role = user.getRole() != null ? user.getRole().toUpperCase() : "";
             if (usernameLower.contains("test") || emailLower.contains("test") 
                     || role.equals("ADMIN") || role.equals("ORG_ADMIN")
                     || !"ACTIVE".equalsIgnoreCase(user.getStatus())) {
                 continue;
             }

            List<ActivityLog> userLogs = logsByUser.getOrDefault(user.getId(), Collections.emptyList());
            int activityCount = userLogs.size();
            double totalEmissions = userLogs.stream()
                    .mapToDouble(l -> l.getCalculatedEmissions() != null ? l.getCalculatedEmissions() : 0.0)
                    .sum();

            double totalCO2Emitted = totalEmissions;

            List<UserBadge> userBadges = userBadgesByUser.getOrDefault(user.getId(), Collections.emptyList());
            List<String> badges = userBadges.stream()
                    .map(ub -> badgeMap.get(ub.getBadgeId()))
                    .filter(Objects::nonNull)
                    .map(Badge::getName)
                    .collect(Collectors.toList());

            String badge = badges.isEmpty() ? null : badges.get(0);
            CategoryStrength strength = determineCategoryStrength(userLogs);
            int footprintScore = Math.max(0, Math.min(100,
                    100 - (int) Math.round(totalCO2Emitted)));

            String displayName = user.getUsername();
            boolean isSelf = user.getId().equals(currentUserId);
            boolean isAnon = user.getIsAnonymous() != null && user.getIsAnonymous();
            String customAnonName = (user.getAnonymousName() != null && !user.getAnonymousName().isBlank())
                    ? user.getAnonymousName().trim()
                    : "Anonymous User #" + (user.getId() % 10000);

            if (isAnon) {
                displayName = customAnonName;
            }

            responseList.add(new LeaderboardUserResponse(
                    user.getId(),
                    displayName,
                    0,
                    totalCO2Emitted,
                    totalCO2Emitted,
                    activityCount,
                    badges,
                    badge,
                    footprintScore,
                    strength.label(),
                    strength.tip(),
                    isSelf,
                    user.getOrganisation() != null ? user.getOrganisation().getId() : null,
                    isAnon,
                    customAnonName
            ));
        }

        responseList.sort((a, b) -> {
            boolean aActive = a.getActivityCount() > 0;
            boolean bActive = b.getActivityCount() > 0;
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;
            if (aActive && bActive) {
                int cmp = Double.compare(a.getTotalCO2Saved(), b.getTotalCO2Saved());
                if (cmp != 0) return cmp;
                return a.getUsername().compareToIgnoreCase(b.getUsername());
            }
            return a.getUsername().compareToIgnoreCase(b.getUsername());
        });

        for (int i = 0; i < responseList.size(); i++) {
            LeaderboardUserResponse ur = responseList.get(i);
            ur.setRank(i + 1);
        }

        return responseList;

    }

    private CategoryStrength determineCategoryStrength(List<ActivityLog> logs) {
        if (logs == null || logs.isEmpty()) {
            return new CategoryStrength(
                    "Strength developing",
                    "Log activities consistently to discover a supported low-carbon strength."
            );
        }
        Map<String, DoubleSummaryStatistics> categoryStats = logs.stream()
                .filter(log -> log.getCategory() != null && log.getCalculatedEmissions() != null)
                .collect(Collectors.groupingBy(
                        log -> normaliseCategory(log.getCategory()),
                        Collectors.summarizingDouble(ActivityLog::getCalculatedEmissions)
                ));
        String category = categoryStats.entrySet().stream()
                .filter(entry -> entry.getValue().getCount() > 0)
                .min(Comparator.comparingDouble(entry -> entry.getValue().getAverage()))
                .map(Map.Entry::getKey)
                .orElse("none");
        return switch (category) {
            case "transport" -> new CategoryStrength("Low-carbon traveller", "Uses lower-emission transport habits.");
            case "electricity" -> new CategoryStrength("Energy saver", "Shows a lower average footprint in home energy.");
            case "food" -> new CategoryStrength("Sustainable eater", "Shows a lower average footprint in food choices.");
            case "shopping" -> new CategoryStrength("Conscious shopper", "Shows a lower average footprint in shopping.");
            default -> new CategoryStrength("Balanced contributor", "Maintains a balanced category footprint.");
        };
    }

    private String normaliseCategory(String category) {
        String value = category.toLowerCase(Locale.ROOT).trim();
        return value.equals("energy") || value.equals("home_energy") ? "electricity" : value;
    }

    private record CategoryStrength(String label, String tip) {}

    private void revokeLeaderboardBadge(Long userId, String badgeName) {
        badgeRepository.findAll().stream()
            .filter(b -> badgeName.equals(b.getName()))
            .findFirst()
            .ifPresent(badge -> {
                userBadgeRepository.findAll().stream()
                    .filter(ub -> ub.getUserId().equals(userId) && ub.getBadgeId().equals(badge.getId()))
                    .findFirst()
                    .ifPresent(userBadgeRepository::delete);
            });
    }

    private void awardBadgeIfMissing(Long userId, String badgeName, String description) {
        Badge badge = badgeRepository.findAll().stream()
                .filter(b -> badgeName.equals(b.getName()))
                .findFirst()
                .orElse(null);

        if (badge == null) {
            badge = new Badge();
            badge.setName(badgeName);
            badge.setDescription(description);
            badge.setTriggerType("LEADERBOARD");
            badge.setThreshold(0.0);
            badge = badgeRepository.save(badge);
        }

        final Badge finalBadge = badge;
        boolean alreadyHasBadge = userBadgeRepository.findAll().stream()
                .anyMatch(ub -> ub.getUserId().equals(userId) && ub.getBadgeId().equals(finalBadge.getId()));

        if (!alreadyHasBadge) {
            UserBadge userBadge = new UserBadge();
            userBadge.setUserId(userId);
            userBadge.setBadgeId(finalBadge.getId());
            userBadgeRepository.save(userBadge);
        }
    }
}
