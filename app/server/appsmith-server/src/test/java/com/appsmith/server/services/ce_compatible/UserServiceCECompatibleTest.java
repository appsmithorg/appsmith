package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
class UserServiceCECompatibleTest {

    @Autowired
    UserService userService;

    @MockBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    public void beforeSetup() {
        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(Boolean.FALSE));
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testCreateProvisionUser() {
        String testName = "testCreateProvisionUser";
        User user = new User();
        user.setEmail(testName + "@appsmith.com");
        Mono<ProvisionResourceDto> provisionUserMono = userService.createProvisionUser(user);
        StepVerifier.create(provisionUserMono)
                .expectErrorMatches(exception -> exception instanceof AppsmithException
                        && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testUpdateProvisionUser() {
        String testName = "testUpdateProvisionUser";
        User user = new User();
        user.setEmail(testName + "@appsmith.com");
        User createdUser = userService.userCreate(user, false).block();

        UserUpdateDTO userUpdateDto = new UserUpdateDTO();
        userUpdateDto.setName("test name");
        Mono<ProvisionResourceDto> updatedProvisionedUserMono =
                userService.updateProvisionUser(createdUser.getId(), userUpdateDto);
        StepVerifier.create(updatedProvisionedUserMono)
                .expectErrorMatches(exception -> exception instanceof AppsmithException
                        && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testGetProvisionUser() {
        String testName = "testGetProvisionUser";
        User user = new User();
        user.setEmail(testName + "@appsmith.com");
        User createdUser = userService.userCreate(user, false).block();

        Mono<ProvisionResourceDto> provisionUserMono = userService.getProvisionUser(createdUser.getId());
        StepVerifier.create(provisionUserMono)
                .expectErrorMatches(exception -> exception instanceof AppsmithException
                        && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testGetProvisionUsers() {
        String testName = "testGetProvisionUsers";
        User user = new User();
        user.setEmail(testName + "@appsmith.com");
        User createdUser = userService.userCreate(user, false).block();
        Mono<PagedDomain<ProvisionResourceDto>> provisionUsersMono =
                userService.getProvisionUsers(new LinkedMultiValueMap<>());
        StepVerifier.create(provisionUsersMono)
                .expectErrorMatches(exception -> exception instanceof AppsmithException
                        && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
                .verify();
    }
}
