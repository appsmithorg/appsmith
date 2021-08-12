package com.appsmith.server.repositories;

import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private List<User> savedUsers = new ArrayList<>();

    @BeforeEach
    public void setUp() {
        this.savedUsers.clear();
    }

    @AfterEach
    public void cleanUp() {
        for(User savedUser : savedUsers) {
            userRepository.deleteById(savedUser.getId()).block();
        }
    }

    @Test
    void findByCaseInsensitiveEmail_WhenCaseIsSame_ReturnsResult() {
        User user = new User();
        user.setEmail("rafiqnayan@gmail.com");
        User savedUser = userRepository.save(user).block();
        savedUsers.add(savedUser);

        Mono<User> findUserMono = userRepository.findByCaseInsensitiveEmail("rafiqnayan@gmail.com");

        StepVerifier.create(findUserMono).assertNext(u -> {
            assertEquals(savedUser.getEmail(), u.getEmail());
        }).verifyComplete();
    }

    @Test
    void findByCaseInsensitiveEmail_WhenCaseIsDifferent_ReturnsResult() {
        User user = new User();
        user.setEmail("rafiqNAYAN@gmail.com");
        User savedUser = userRepository.save(user).block();
        savedUsers.add(savedUser);

        Mono<User> findUserByEmailMono = userRepository.findByCaseInsensitiveEmail("rafiqnayan@gmail.com");

        StepVerifier.create(findUserByEmailMono).assertNext(u -> {
            assertEquals(savedUser.getEmail(), u.getEmail());
        }).verifyComplete();
    }

    @Test
    void findByCaseInsensitiveEmail_WhenMultipleMatches_ReturnsResult() {
        User user1 = new User();
        user1.setEmail("rafiqNAYAN@gmail.com");
        User savedUser1 = userRepository.save(user1).block();
        savedUsers.add(savedUser1);

        User user2 = new User();
        user2.setEmail("RAFIQNAYAN@gmail.com");
        User savedUser2 = userRepository.save(user2).block();
        savedUsers.add(savedUser2);

        Mono<User> findUserByEmailMono = userRepository.findByCaseInsensitiveEmail("rafiqnayan@gmail.com");

        StepVerifier.create(findUserByEmailMono).assertNext(u -> {
            assertEquals(savedUser2.getEmail(), u.getEmail());
        }).verifyComplete();
    }

    @Test
    void findByCaseInsensitiveEmail_WhenNoMatch_ReturnsNone() {
        User user = new User();
        user.setEmail("rafiqnayan@gmail.com");
        User savedUser = userRepository.save(user).block();
        savedUsers.add(savedUser);

        Mono<User> getByEmailMono = userRepository.findByCaseInsensitiveEmail("nayan@gmail.com");
        StepVerifier.create(getByEmailMono).verifyComplete();

        Mono<User> getByEmailMono2 = userRepository.findByCaseInsensitiveEmail("rafiqnayan@gmail.co");
        StepVerifier.create(getByEmailMono2).verifyComplete();

        Mono<User> getByEmailMono3 = userRepository.findByCaseInsensitiveEmail("rafiq.nayan@gmail.com");
        StepVerifier.create(getByEmailMono3).verifyComplete();

        Mono<User> getByEmailMono4 = userRepository.findByCaseInsensitiveEmail("rafiq.ayan@gmail.com");
        StepVerifier.create(getByEmailMono4).verifyComplete();
    }
}