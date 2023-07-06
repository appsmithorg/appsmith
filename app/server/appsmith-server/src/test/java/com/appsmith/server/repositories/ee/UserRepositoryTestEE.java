package com.appsmith.server.repositories.ee;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Slf4j
@DirtiesContext
public class UserRepositoryTestEE {
    @Autowired
    private UserRepository userRepository;

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetUsersWithParamsPaginated_multipleEmails_allExistingEmailsShouldCome() {
        String testName = "testGetUsersWithParamsPaginated_multipleEmails_allExistingEmailsShouldCome";
        User user1 = new User();
        user1.setEmail(testName + "_1@appsmith.com");
        User createdUser1 = userRepository.save(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_2@appsmith.com");
        User createdUser2 = userRepository.save(user2).block();

        String nonExistingUserEmail = testName + "_3@appsmith.com";

        List<String> emailsForFilter = List.of(user1.getEmail(), user2.getEmail(), nonExistingUserEmail);

        // test for both users created above.
        PagedDomain<User> pagedUsers = userRepository
                .getUsersWithParamsPaginated(2, 0, emailsForFilter, Optional.empty())
                .block();
        assertThat(pagedUsers.getCount()).isEqualTo(2);
        assertThat(pagedUsers.getTotal()).isEqualTo(2);

        Optional<User> optionalUser1 = pagedUsers.getContent().stream()
                .filter(user -> user.getEmail().equals(user1.getEmail()))
                .findFirst();
        Optional<User> optionalUser2 = pagedUsers.getContent().stream()
                .filter(user -> user.getEmail().equals(user2.getEmail()))
                .findFirst();
        Optional<User> optionalUser3 = pagedUsers.getContent().stream()
                .filter(user -> user.getEmail().equals(nonExistingUserEmail))
                .findFirst();
        assertThat(optionalUser1.isPresent()).isTrue();
        assertThat(optionalUser2.isPresent()).isTrue();
        assertThat(optionalUser3.isPresent()).isFalse();

        assertThat(optionalUser1.get().getId()).isEqualTo(createdUser1.getId());
        assertThat(optionalUser2.get().getId()).isEqualTo(createdUser2.getId());
        // test for both users created above.

        userRepository
                .deleteAllById(List.of(createdUser1.getId(), createdUser2.getId()))
                .block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetUsersWithParamsPaginated_multipleEmailsCaseInsensitive_allExistingEmailsShouldCome() {
        String testName = "testGetUsersWithParamsPaginated_multipleEmailsCaseInsensitive_allExistingEmailsShouldCome";
        User user1 = new User();
        user1.setEmail(testName + "_1@appsmith.com");
        User createdUser1 = userRepository.save(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_2@appsmith.com");
        User createdUser2 = userRepository.save(user2).block();

        String nonExistingUserEmail = testName + "_3@appsmith.com";

        List<String> emailsForFilterUpperCase = List.of(
                user1.getEmail().toUpperCase(), user2.getEmail().toUpperCase(), nonExistingUserEmail.toUpperCase());

        // test for both users created above.
        PagedDomain<User> pagedUsers = userRepository
                .getUsersWithParamsPaginated(2, 0, emailsForFilterUpperCase, Optional.empty())
                .block();
        assertThat(pagedUsers.getCount()).isEqualTo(2);
        assertThat(pagedUsers.getTotal()).isEqualTo(2);

        Optional<User> optionalUser1 = pagedUsers.getContent().stream()
                .filter(user -> user.getEmail().equals(user1.getEmail()))
                .findFirst();
        Optional<User> optionalUser2 = pagedUsers.getContent().stream()
                .filter(user -> user.getEmail().equals(user2.getEmail()))
                .findFirst();
        Optional<User> optionalUser3 = pagedUsers.getContent().stream()
                .filter(user -> user.getEmail().equals(nonExistingUserEmail))
                .findFirst();
        assertThat(optionalUser1.isPresent()).isTrue();
        assertThat(optionalUser2.isPresent()).isTrue();
        assertThat(optionalUser3.isPresent()).isFalse();

        assertThat(optionalUser1.get().getId()).isEqualTo(createdUser1.getId());
        assertThat(optionalUser2.get().getId()).isEqualTo(createdUser2.getId());
        // test for both users created above.

        userRepository
                .deleteAllById(List.of(createdUser1.getId(), createdUser2.getId()))
                .block();
    }
}
