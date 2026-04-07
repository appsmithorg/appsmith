package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class CustomUserRepositoryCEImplTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private ReactiveMongoOperations reactiveMongoOperations;

    private final List<User> savedUsers = new ArrayList<>();
    private static final Set<String> PREDEFINED_SYSTEM_USERS = Set.of("anonymousUser");

    @BeforeEach
    public void setUp() {
        this.savedUsers.clear();
    }

    @AfterEach
    public void cleanUp() {
        for (User savedUser : savedUsers) {
            userRepository.deleteById(savedUser.getId()).block();
        }
    }

    @Test
    public void getSystemGeneratedUserEmails_WhenSystemGeneratedUsersExist_ReturnsTheirEmails() {
        String defaultOrgId = organizationRepository
                .findBySlug("default")
                .map(Organization::getId)
                .block();

        // Create an additional system-generated user
        User systemUser = new User();
        systemUser.setEmail("system@test.com");
        systemUser.setIsSystemGenerated(true);
        systemUser.setOrganizationId(defaultOrgId);
        User savedSystemUser = userRepository.save(systemUser).block();
        savedUsers.add(savedSystemUser);

        // Create a non-system-generated user
        User nonSystemUser = new User();
        nonSystemUser.setEmail("non-system@test.com");
        nonSystemUser.setIsSystemGenerated(false);
        nonSystemUser.setOrganizationId(defaultOrgId);
        User savedNonSystemUser = userRepository.save(nonSystemUser).block();
        savedUsers.add(savedNonSystemUser);

        // Test the method
        Flux<String> systemGeneratedEmails = userRepository.getSystemGeneratedUserEmails(defaultOrgId);

        StepVerifier.create(systemGeneratedEmails.collectList())
                .assertNext(emails -> {
                    // Verify all predefined system users are present
                    assertThat(emails).containsAll(PREDEFINED_SYSTEM_USERS);
                    // Verify our test system user is present
                    assertThat(emails).contains("system@test.com");
                    // Verify non-system user is not present
                    assertThat(emails).doesNotContain("non-system@test.com");
                    // Verify total count is correct (predefined users + our test user)
                    assertThat(emails).hasSize(PREDEFINED_SYSTEM_USERS.size() + 1);
                })
                .verifyComplete();
    }

    @Test
    public void getSystemGeneratedUserEmails_WhenNoAdditionalSystemGeneratedUsersExist_ReturnsOnlyPredefinedUsers() {
        String defaultOrgId = organizationRepository
                .findBySlug("default")
                .map(Organization::getId)
                .block();

        // Create only non-system-generated user
        User nonSystemUser = new User();
        nonSystemUser.setEmail("non-system@test.com");
        nonSystemUser.setIsSystemGenerated(false);
        nonSystemUser.setOrganizationId(defaultOrgId);
        User savedNonSystemUser = userRepository.save(nonSystemUser).block();
        savedUsers.add(savedNonSystemUser);

        // Test the method
        Flux<String> systemGeneratedEmails = userRepository.getSystemGeneratedUserEmails(defaultOrgId);

        StepVerifier.create(systemGeneratedEmails.collectList())
                .assertNext(emails -> {
                    // Verify only predefined system users are present
                    assertThat(emails).containsExactlyInAnyOrderElementsOf(PREDEFINED_SYSTEM_USERS);
                    // Verify non-system user is not present
                    assertThat(emails).doesNotContain("non-system@test.com");
                })
                .verifyComplete();
    }

    @Test
    public void isUsersEmpty_WhenNonSystemUsersExist_ReturnsFalse() {
        // Create a non-system-generated user
        User nonSystemUser = new User();
        nonSystemUser.setEmail("non-system@test.com");
        User savedNonSystemUser = userRepository.save(nonSystemUser).block();
        savedUsers.add(savedNonSystemUser);

        // Test the method
        StepVerifier.create(userRepository.isUsersEmpty())
                .assertNext(isEmpty -> {
                    assertThat(isEmpty).isFalse();
                })
                .verifyComplete();
    }

    @Test
    public void claimSuperUserCreationSlot_FirstCallSucceeds() {
        dropSuperUserSetupLockCollection();

        StepVerifier.create(userRepository.claimSuperUserCreationSlot())
                .assertNext(claimed -> {
                    assertThat(claimed).isTrue();
                })
                .verifyComplete();

        dropSuperUserSetupLockCollection();
    }

    @Test
    public void claimSuperUserCreationSlot_SecondCallFails() {
        dropSuperUserSetupLockCollection();

        // First claim should succeed
        Boolean firstClaim = userRepository.claimSuperUserCreationSlot().block();
        assertThat(firstClaim).isTrue();

        // Second claim should fail
        StepVerifier.create(userRepository.claimSuperUserCreationSlot())
                .assertNext(claimed -> {
                    assertThat(claimed).isFalse();
                })
                .verifyComplete();

        dropSuperUserSetupLockCollection();
    }

    @Test
    public void claimSuperUserCreationSlot_ConcurrentClaimsOnlyOneSucceeds() {
        dropSuperUserSetupLockCollection();

        int concurrentAttempts = 10;
        List<Mono<Boolean>> claimMonos = new ArrayList<>();
        for (int i = 0; i < concurrentAttempts; i++) {
            claimMonos.add(userRepository.claimSuperUserCreationSlot());
        }

        // Execute all claims concurrently and collect results
        List<Boolean> results = Flux.merge(claimMonos).collectList().block();

        assertThat(results).isNotNull();
        assertThat(results).hasSize(concurrentAttempts);

        long successCount = results.stream().filter(Boolean::booleanValue).count();
        assertThat(successCount).isEqualTo(1);

        long failureCount = results.stream().filter(r -> !r).count();
        assertThat(failureCount).isEqualTo(concurrentAttempts - 1);

        dropSuperUserSetupLockCollection();
    }

    private void dropSuperUserSetupLockCollection() {
        try {
            reactiveMongoOperations.dropCollection("superUserSetupLock").block();
        } catch (Exception e) {
            // Collection may not exist, that's fine
        }
    }
}
