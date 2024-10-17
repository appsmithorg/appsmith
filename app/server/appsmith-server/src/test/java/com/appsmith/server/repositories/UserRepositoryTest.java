package com.appsmith.server.repositories;

import com.appsmith.server.domains.User;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.repositories.cakes.UserRepositoryCake;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(AfterAllCleanUpExtension.class)
@SpringBootTest
@Slf4j
public class UserRepositoryTest {

    @Autowired
    private UserRepositoryCake userRepository;

    private final List<User> savedUsers = new ArrayList<>();

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
        User savedUser = userRepository.save(user).block();
        savedUsers.add(savedUser);

        Mono<User> findUserMono = userRepository.findFirstByEmailIgnoreCaseOrderByCreatedAtDesc("rafiqnayan@gmail.com");

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
        User savedUser = userRepository.save(user).block();
        savedUsers.add(savedUser);

        Mono<User> findUserByEmailMono =
                userRepository.findFirstByEmailIgnoreCaseOrderByCreatedAtDesc("rafiqnayan@gmail.com");

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
        User savedUser1 = userRepository.save(user1).block();
        savedUsers.add(savedUser1);

        User user2 = new User();
        user2.setEmail("RAFIQNAYAN@gmail.com");
        User savedUser2 = userRepository.save(user2).block();
        savedUsers.add(savedUser2);

        Mono<User> findUserByEmailMono =
                userRepository.findFirstByEmailIgnoreCaseOrderByCreatedAtDesc("rafiqnayan@gmail.com");

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
        User savedUser = userRepository.save(user).block();
        savedUsers.add(savedUser);

        Mono<User> getByEmailMono = userRepository.findFirstByEmailIgnoreCaseOrderByCreatedAtDesc("nayan@gmail.com");
        StepVerifier.create(getByEmailMono).verifyComplete();

        Mono<User> getByEmailMono2 =
                userRepository.findFirstByEmailIgnoreCaseOrderByCreatedAtDesc("rafiqnayan@gmail.co");
        StepVerifier.create(getByEmailMono2).verifyComplete();

        Mono<User> getByEmailMono3 =
                userRepository.findFirstByEmailIgnoreCaseOrderByCreatedAtDesc("rafiq.nayan@gmail.com");
        StepVerifier.create(getByEmailMono3).verifyComplete();

        Mono<User> getByEmailMono4 =
                userRepository.findFirstByEmailIgnoreCaseOrderByCreatedAtDesc("rafiq.ayan@gmail.com");
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
            userRepository.save(user).block();
        });

        List<User> allCreatedUsers = userRepository
                .findAllByEmailIn(new HashSet<>(unsortedEmails))
                .collectList()
                .block();
        assertEquals(countOfUsersToBeCreated, allCreatedUsers.size());
    }
}
