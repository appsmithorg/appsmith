package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class UserDataServiceTest {

    @Autowired
    UserService userService;

    @Autowired
    private UserDataService userDataService;

    private Mono<User> userMono;

    @Before
    public void setup() {
        userMono = userService.findByEmail("usertest@usertest.com");
    }

    @Test
    public void ensureViewedReleaseVersionNotesIsSet() {
        final Mono<UserData> resultMono = userMono
                .flatMap(user -> userDataService.ensureViewedCurrentVersionReleaseNotes(user))
                .flatMap(user -> userDataService.getForUser(user));

        StepVerifier.create(resultMono)
                .assertNext(userData -> {
                    assertThat(userData.getReleaseNotesViewedVersion()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    public void setViewedReleaseNotesVersion() {
        final Mono<UserData> resultMono = userMono
                .flatMap(user -> userDataService.setViewedCurrentVersionReleaseNotes(user, "version-1"))
                .flatMap(user -> userDataService.getForUser(user));

        StepVerifier.create(resultMono)
                .assertNext(userData -> {
                    assertThat(userData.getReleaseNotesViewedVersion()).isEqualTo("version-1");
                })
                .verifyComplete();
    }

    @Test
    public void updateViewedReleaseNotesVersion() {
        final Mono<UserData> resultMono = userMono
                .flatMap(user -> userDataService.setViewedCurrentVersionReleaseNotes(user, "version-1"))
                .flatMap(user -> userDataService.setViewedCurrentVersionReleaseNotes(user, "version-2"))
                .flatMap(user -> userDataService.getForUser(user));

        StepVerifier.create(resultMono)
                .assertNext(userData -> {
                    assertThat(userData.getReleaseNotesViewedVersion()).isEqualTo("version-2");
                })
                .verifyComplete();
    }

}
