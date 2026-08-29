package com.carbontrack.backend.config;

import com.carbontrack.backend.entity.*;
import com.carbontrack.backend.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@Profile("!test")
@Order(20)
public class DevelopmentDemoDataInitializer implements ApplicationRunner {

    private final OrganisationRepository organisationRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final GoalRepository goalRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final ChallengeRepository challengeRepository;
    private final UserChallengeRepository userChallengeRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${carbontrack.demo.enabled:true}")
    private boolean enabled;
    @Value("${carbontrack.demo.password:Password@123}")
    private String configuredPassword;

    public DevelopmentDemoDataInitializer(
            OrganisationRepository organisationRepository, UserRepository userRepository,
            ActivityLogRepository activityLogRepository, GoalRepository goalRepository,
            BadgeRepository badgeRepository, UserBadgeRepository userBadgeRepository,
            ChallengeRepository challengeRepository, UserChallengeRepository userChallengeRepository,
            PasswordEncoder passwordEncoder) {
        this.organisationRepository = organisationRepository;
        this.userRepository = userRepository;
        this.activityLogRepository = activityLogRepository;
        this.goalRepository = goalRepository;
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.challengeRepository = challengeRepository;
        this.userChallengeRepository = userChallengeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String targetPassword = (configuredPassword != null && !configuredPassword.isBlank()) ? configuredPassword : "Password@123";

        seedDefaultChallenges();

        // Ensure Org Admin accounts have the 2 corporate goals if none exist
        userRepository.findAll().stream()
                .filter(u -> "ORG_ADMIN".equalsIgnoreCase(u.getRole()))
                .forEach(admin -> {
                    if (goalRepository.findByUserId(admin.getId()).isEmpty()) {
                        seedStarterGoals(admin.getId());
                    }
                });

        if (!enabled || organisationRepository.count() > 0) {
            return;
        }

        String rawPassword = targetPassword;
        String passwordHash = passwordEncoder.encode(rawPassword);
        Badge badge = badgeRepository.save(new Badge(null, "Carbon Starter",
                "Logged initial sustainability activities", "STREAK", 3.0));
        Challenge challenge = challengeRepository.findAll().stream().findFirst().orElse(null);

        seedOrganisation("Greenfield Technologies", "greenfield", passwordHash, badge, challenge, 0);
        seedOrganisation("BlueRiver Industries", "blueriver", passwordHash, badge, challenge, 1);
    }

    private void seedStarterGoals(Long adminUserId) {
        Goal goal1 = new Goal();
        goal1.setUserId(adminUserId);
        goal1.setTitle("Cut Electricity Use");
        goal1.setDescription("Lower monthly grid power consumption across company offices.");
        goal1.setCategory("electricity");
        goal1.setPeriod("monthly");
        goal1.setTargetKg(100.0);
        goal1.setCurrentKg(0.0);
        goal1.setStartDate(LocalDate.now().withDayOfMonth(1));
        goal1.setEndDate(LocalDate.now().plusMonths(1).withDayOfMonth(1).minusDays(1));
        goal1.setStatus("ACTIVE");
        goal1.setOrganisationManaged(true);
        goal1.setResponsibleDepartment("Sustainability");
        goalRepository.save(goal1);

        Goal goal2 = new Goal();
        goal2.setUserId(adminUserId);
        goal2.setTitle("Optimize Corporate Transport");
        goal2.setDescription("Encourage carpooling, electric transit, and eco commute.");
        goal2.setCategory("transport");
        goal2.setPeriod("monthly");
        goal2.setTargetKg(150.0);
        goal2.setCurrentKg(0.0);
        goal2.setStartDate(LocalDate.now().withDayOfMonth(1));
        goal2.setEndDate(LocalDate.now().plusMonths(1).withDayOfMonth(1).minusDays(1));
        goal2.setStatus("ACTIVE");
        goal2.setOrganisationManaged(true);
        goal2.setResponsibleDepartment("Operations");
        goalRepository.save(goal2);
    }

    private void seedDefaultChallenges() {
        List<Challenge> defaults = List.of(
            new Challenge(null, "Low Carbon Week", "Log sustainable choices throughout the week", "all", "LOG_ENTRIES", 4.0, 250, "leaf", "weekly", null),
            new Challenge(null, "Eco Commuter Sprint", "Log 3 eco-friendly travel choices like carpooling, cycling, or EV transit.", "transport", "LOG_ENTRIES", 3.0, 200, "car", "weekly", null),
            new Challenge(null, "Electricity Saver", "Keep weekly power emissions below 15 kg CO₂e through smart energy habits.", "electricity", "REDUCE_EMISSIONS", 15.0, 250, "zap", "weekly", null),
            new Challenge(null, "Plant-Based Streak", "Log vegetarian or low-impact plant-based meals on 4 separate days.", "food", "LOG_DAYS", 4.0, 300, "leaf", "weekly", null),
            new Challenge(null, "Zero-Waste Retailer", "Log 2 eco-conscious, minimal packaging or sustainable retail choices.", "shopping", "LOG_ENTRIES", 2.0, 180, "shopping-bag", "weekly", null),
            new Challenge(null, "Clean Energy Pioneer", "Log renewable energy usage or efficient power habits 5 times this month.", "electricity", "LOG_ENTRIES", 5.0, 400, "zap", "monthly", null),
            new Challenge(null, "Eco Transit Champion", "Choose low-emission transit on 5 distinct days of the month.", "transport", "LOG_DAYS", 5.0, 350, "car", "monthly", null),
            new Challenge(null, "Green Hero Monthly Sprint", "Achieve 10 total logged sustainability activities across all categories.", "all", "LOG_ENTRIES", 10.0, 500, "award", "monthly", null)
        );

        for (Challenge c : defaults) {
            boolean exists = challengeRepository.findAll().stream()
                    .anyMatch(existing -> existing.getTitle().equalsIgnoreCase(c.getTitle()));
            if (!exists) {
                challengeRepository.save(c);
            }
        }
    }

    private void seedOrganisation(String name, String slug, String passwordHash,
                                  Badge badge, Challenge challenge, int organisationIndex) {
        Organisation organisation = new Organisation();
        organisation.setName(name);
        organisation.setActive(true);
        organisation = organisationRepository.save(organisation);

        // Create the Org Admin account
        User adminUser = new User();
        adminUser.setUsername(slug + "_user_1");
        adminUser.setEmail(slug + "1@demo.carbontrack.local");
        adminUser.setPasswordHash(passwordHash);
        adminUser.setRole("ORG_ADMIN");
        adminUser.setOrganisation(organisation);
        adminUser.setDepartment("Management");
        adminUser = userRepository.save(adminUser);

        organisation.setAdminUserId(adminUser.getId());
        organisationRepository.save(organisation);
    }
}
