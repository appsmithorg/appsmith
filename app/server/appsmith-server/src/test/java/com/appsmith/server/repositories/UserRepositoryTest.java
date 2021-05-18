package com.appsmith.server.repositories;

import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.assertEquals;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    public void setUp() {
        userRepository.deleteAll().block();
    }

    @Test
    void findByCaseInsensitiveEmail_WhenCaseIsSame_ReturnsResult() {
        User user = new User();
        user.setEmail("rafiqnayan@gmail.com");
        User savedUser = userRepository.save(user).block();

        Mono<User> findUserMono = userRepository.findByCaseInsensitiveEmail("rafiqnayan@gmail.com");

        StepVerifier.create(findUserMono).assertNext(u -> {
            assertEquals(savedUser.getEmail(), u.getEmail());
        }).verifyComplete();
    }

    @Test
    void findByCaseInsensitiveEmail_WhenCaseIsDifferent_ReturnsResult() {
        User user = new User();
        user.setEmail("rafiqNAYAN@gmail.com");
        User saveUser = userRepository.save(user).block();

        Mono<User> findUserByEmailMono = userRepository.findByCaseInsensitiveEmail("rafiqnayan@gmail.com");

        StepVerifier.create(findUserByEmailMono).assertNext(u -> {
            assertEquals(saveUser.getEmail(), u.getEmail());
        }).verifyComplete();
    }

    @Test
    void findByCaseInsensitiveEmail_WhenMultipleMatches_ReturnsResult() {
        User user1 = new User();
        user1.setEmail("rafiqNAYAN@gmail.com");
        User saveUser1 = userRepository.save(user1).block();

        User user2 = new User();
        user2.setEmail("RAFIQNAYAN@gmail.com");
        User savedUser2 = userRepository.save(user2).block();

        Mono<User> findUserByEmailMono = userRepository.findByCaseInsensitiveEmail("rafiqnayan@gmail.com");

        StepVerifier.create(findUserByEmailMono).assertNext(u -> {
            assertEquals(savedUser2.getEmail(), u.getEmail());
        }).verifyComplete();
    }

    @Test
    void findByCaseInsensitiveEmail_WhenNoMatch_ReturnsNone() {
        User user = new User();
        user.setEmail("rafiqnayan@gmail.com");
        userRepository.save(user).block();
        Mono<User> getByEmailMono = userRepository.findByCaseInsensitiveEmail("nayan@gmail.com");
        StepVerifier.create(getByEmailMono).verifyComplete();

        Mono<User> getByEmailMono2 = userRepository.findByCaseInsensitiveEmail("rafiqnayan@gmail.co");
        StepVerifier.create(getByEmailMono2).verifyComplete();

        Mono<User> getByEmailMono3 = userRepository.findByCaseInsensitiveEmail("rafiq.nayan@gmail.com");
        StepVerifier.create(getByEmailMono3).verifyComplete();
    }
}