package com.appsmith.server.solutions;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Optional;

import static com.appsmith.server.constants.FieldName.ANONYMOUS_USER;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class UserManagementServiceTest {

    @Autowired
    UserManagementService userManagementService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    User api_user = null;

    String superAdminPermissionGroupId = null;

    @BeforeEach
    public void setup() {
        if (api_user == null) {
            api_user = userRepository.findByEmail("api_user").block();
        }

        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAllUsersForManagementTest_valid() {

        Mono<List<UserForManagementDTO>> allUsersMono = userManagementService.getAllUsers();

        StepVerifier.create(allUsersMono)
                .assertNext(users -> {
                    assertThat(users).isNotNull();
                    assertThat(users.size()).isGreaterThan(0);

                    UserForManagementDTO apiUserDto = users.stream().filter(user -> user.getUsername().equals("api_user")).findFirst().get();
                    assertThat(apiUserDto.getId()).isEqualTo(api_user.getId());
                    assertThat(apiUserDto.getGroups().size()).isEqualTo(0);
                    assertThat(apiUserDto.getRoles().size()).isEqualTo(1);
                    assertThat(apiUserDto.getRoles().get(0).getName()).isEqualTo("Instance Administrator Role");

                    // Also assert that anonymous user is not returned inside the list of users
                    Optional<UserForManagementDTO> anonymousUserOptional = users.stream().filter(user -> user.getUsername().equals(ANONYMOUS_USER)).findFirst();
                    assertThat(anonymousUserOptional.isPresent()).isFalse();

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void getAllUsersForManagementTest_invalid() {
        Mono<List<UserForManagementDTO>> allUsersMono = userManagementService.getAllUsers();

        StepVerifier.create(allUsersMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                throwable.getMessage()
                                        .equals(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS).getMessage())
                )
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getSingleUserForManagementTest_valid() {

        Mono<UserForManagementDTO> userByIdMono = userManagementService.getUserById(api_user.getId());

        StepVerifier.create(userByIdMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();

                    assertThat(user.getId()).isEqualTo(api_user.getId());
                    assertThat(user.getGroups().size()).isEqualTo(0);
                    assertThat(user.getRoles().size()).isEqualTo(1);
                    assertThat(user.getRoles().get(0).getName()).isEqualTo("Instance Administrator Role");

                    // Assert that name is also returned.
                    assertThat(user.getName()).isEqualTo("api_user");

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void getSingleUserForManagementTest_invalid() {
        Mono<UserForManagementDTO> userByIdMono = userManagementService.getUserById(api_user.getId());

        StepVerifier.create(userByIdMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                throwable.getMessage()
                                        .equals(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS).getMessage())
                )
                .verify();
    }
}
