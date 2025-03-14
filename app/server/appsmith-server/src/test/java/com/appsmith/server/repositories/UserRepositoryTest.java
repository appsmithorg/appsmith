package com.appsmith.server.repositories;

import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Slf4j
@DirtiesContext
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private final List<User> savedUsers = new ArrayList<>();
    private static final String ORG_ID = UUID.randomUUID().toString();

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
    public void findByCaseInsensitiveEmail_WhenCaseIsSame_ReturnsResult() {
        User user = new User();
        user.setEmail("rafiqnayan@gmail.com");
        user.setOrganizationId(ORG_ID);
        User savedUser = userRepository.save(user).block();
        savedUsers.add(savedUser);

        Mono<User> findUserMono = userRepository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                "rafiqnayan@gmail.com", ORG_ID);

        StepVerifier.create(findUserMono)
                .assertNext(u -> {
                    assertEquals(savedUser.getEmail(), u.getEmail());
                })
                .verifyComplete();
    }

    @Test
    public void findByCaseInsensitiveEmail_WhenCaseIsDifferent_ReturnsResult() {
        User user = new User();
        user.setEmail("rafiqNAYAN@gmail.com");
        user.setOrganizationId(ORG_ID);
        User savedUser = userRepository.save(user).block();
        savedUsers.add(savedUser);

        Mono<User> findUserByEmailMono = userRepository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                "rafiqnayan@gmail.com", ORG_ID);

        StepVerifier.create(findUserByEmailMono)
                .assertNext(u -> {
                    assertEquals(savedUser.getEmail(), u.getEmail());
                })
                .verifyComplete();
    }

    @Test
    public void findByCaseInsensitiveEmail_WhenMultipleMatches_ReturnsResult() {
        User user1 = new User();
        user1.setEmail("rafiqNAYAN@gmail.com");
        user1.setOrganizationId(ORG_ID);
        User savedUser1 = userRepository.save(user1).block();
        savedUsers.add(savedUser1);

        User user2 = new User();
        user2.setEmail("RAFIQNAYAN@gmail.com");
        user2.setOrganizationId(ORG_ID);
        User savedUser2 = userRepository.save(user2).block();
        savedUsers.add(savedUser2);

        Mono<User> findUserByEmailMono = userRepository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                "rafiqnayan@gmail.com", ORG_ID);

        StepVerifier.create(findUserByEmailMono)
                .assertNext(u -> {
                    assertEquals(savedUser2.getEmail(), u.getEmail());
                })
                .verifyComplete();
    }

    @Test
    public void findByCaseInsensitiveEmail_WhenNoMatch_ReturnsNone() {
        User user = new User();
        user.setEmail("rafiqnayan@gmail.com");
        user.setOrganizationId(ORG_ID);
        User savedUser = userRepository.save(user).block();
        savedUsers.add(savedUser);

        Mono<User> getByEmailMono = userRepository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                "nayan@gmail.com", ORG_ID);
        StepVerifier.create(getByEmailMono).verifyComplete();

        Mono<User> getByEmailMono2 = userRepository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                "rafiqnayan@gmail.co", ORG_ID);
        StepVerifier.create(getByEmailMono2).verifyComplete();

        Mono<User> getByEmailMono3 = userRepository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                "rafiq.nayan@gmail.com", ORG_ID);
        StepVerifier.create(getByEmailMono3).verifyComplete();

        Mono<User> getByEmailMono4 = userRepository.findFirstByEmailIgnoreCaseAndOrganizationIdOrderByCreatedAtDesc(
                "rafiq.ayan@gmail.com", ORG_ID);
        StepVerifier.create(getByEmailMono4).verifyComplete();
    }

    @Test
    void testSkipAndLimitForUserRepo() {
        String uuid = UUID.randomUUID().toString();
        int countOfUsersToBeCreated = 50;
        List<String> unsortedEmails = ThreadLocalRandom.current()
                .ints(0, countOfUsersToBeCreated)
                .distinct()
                .limit(countOfUsersToBeCreated)
                .mapToObj(index -> uuid + "_" + index + "@gmail.com")
                .toList();
        unsortedEmails.forEach(email -> {
            User user = new User();
            user.setEmail(email);
            user.setOrganizationId(ORG_ID);
            userRepository.save(user).block();
        });

        List<User> allCreatedUsers = userRepository
                .findAllByEmailInAndOrganizationId(new HashSet<>(unsortedEmails), ORG_ID)
                .collectList()
                .block();
        assertEquals(countOfUsersToBeCreated, allCreatedUsers.size());
    }
}
