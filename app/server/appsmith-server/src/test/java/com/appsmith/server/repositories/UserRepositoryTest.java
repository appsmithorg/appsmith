package com.appsmith.server.repositories;

import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Sort;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.IntStream;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Slf4j
@DirtiesContext
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

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

        Mono<User> findUserMono = userRepository.findByCaseInsensitiveEmail("rafiqnayan@gmail.com");

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

        Mono<User> findUserByEmailMono = userRepository.findByCaseInsensitiveEmail("rafiqnayan@gmail.com");

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

        Mono<User> findUserByEmailMono = userRepository.findByCaseInsensitiveEmail("rafiqnayan@gmail.com");

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

        Mono<User> getByEmailMono = userRepository.findByCaseInsensitiveEmail("nayan@gmail.com");
        StepVerifier.create(getByEmailMono).verifyComplete();

        Mono<User> getByEmailMono2 = userRepository.findByCaseInsensitiveEmail("rafiqnayan@gmail.co");
        StepVerifier.create(getByEmailMono2).verifyComplete();

        Mono<User> getByEmailMono3 = userRepository.findByCaseInsensitiveEmail("rafiq.nayan@gmail.com");
        StepVerifier.create(getByEmailMono3).verifyComplete();

        Mono<User> getByEmailMono4 = userRepository.findByCaseInsensitiveEmail("rafiq.ayan@gmail.com");
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
        List<String> sortedEmails = new ArrayList<>(unsortedEmails);
        Collections.sort(sortedEmails);
        List<User> createdUsers = unsortedEmails.stream()
                .map(email -> {
                    User user = new User();
                    user.setEmail(email);
                    return userRepository.save(user).block();
                })
                .toList();

        List<User> allCreatedUsers = userRepository
                .findAllByEmails(new HashSet<>(unsortedEmails))
                .collectList()
                .block();
        assertEquals(countOfUsersToBeCreated, allCreatedUsers.size());

        Sort sortByEmailAsc = Sort.by(Sort.Direction.ASC, fieldName(QUser.user.email));
        final int skip1 = 0;
        int limit1 = 10;
        List<User> usersFrom0To10 = userRepository
                .getAllByEmails(
                        new HashSet<>(unsortedEmails),
                        Optional.empty(),
                        limit1,
                        skip1,
                        QUser.user.email,
                        Sort.Direction.ASC)
                .collectList()
                .block();
        assertEquals(usersFrom0To10.size(), limit1);
        List<String> subList0To10 = sortedEmails.subList(skip1, skip1 + limit1);
        IntStream.range(skip1, skip1 + limit1).forEach(index -> {
            usersFrom0To10.get(index - skip1).getEmail().equals(subList0To10.get(index - skip1));
        });

        final int skip2 = 9, limit2 = 10;
        List<User> usersFrom9To19 = userRepository
                .getAllByEmails(
                        new HashSet<>(unsortedEmails),
                        Optional.empty(),
                        limit2,
                        skip2,
                        QUser.user.email,
                        Sort.Direction.ASC)
                .collectList()
                .block();
        assertEquals(usersFrom9To19.size(), limit2);
        List<String> subList9To19 = sortedEmails.subList(skip2, skip2 + limit2);
        IntStream.range(skip2, skip2 + limit2).forEach(index -> {
            usersFrom9To19.get(index - skip2).getEmail().equals(subList9To19.get(index - skip2));
        });
    }
}
