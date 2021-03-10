package com.appsmith.server.services;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.AssetRepository;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class UserDataServiceTest {

    @Autowired
    UserService userService;

    @Autowired
    private UserDataService userDataService;

    @Autowired
    private AssetRepository assetRepository;

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

    @Test
    @WithUserDetails(value = "api_user")
    public void testUploadAndDeleteProfilePhoto_validImage() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(new ClassPathResource("test_assets/OrganizationServiceTest/my_organization_logo.png"), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        Mono<Tuple2<UserData, Asset>> loadProfileImageMono = userDataService.getForUserEmail("api_user")
                .flatMap(userData -> Mono.zip(
                        Mono.just(userData),
                        assetRepository.findById(userData.getProfilePhotoAssetId())
                ));

        final Mono<UserData> saveMono = userDataService.saveProfilePhoto(filepart).cache();
        final Mono<Tuple2<UserData, Asset>> saveAndGetMono = saveMono.then(loadProfileImageMono);
        final Mono<Tuple2<UserData, Asset>> deleteAndGetMono = saveMono.then(userDataService.deleteProfilePhoto()).then(loadProfileImageMono);

        StepVerifier.create(saveAndGetMono)
                .assertNext(tuple -> {
                    final UserData userData = tuple.getT1();
                    assertThat(userData.getProfilePhotoAssetId()).isNotNull();

                    final Asset asset = tuple.getT2();
                    assertThat(asset).isNotNull();
                    DataBuffer buffer = DataBufferUtils.join(dataBufferFlux).block(Duration.ofSeconds(3));
                    byte[] res = new byte[buffer.readableByteCount()];
                    buffer.read(res);
                    assertThat(asset.getData()).isEqualTo(res);
                })
                .verifyComplete();

        StepVerifier.create(deleteAndGetMono)
                // Should be empty since the profile photo has been deleted.
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUploadProfilePhoto_invalidImageFormat() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(new ClassPathResource("test_assets/OrganizationServiceTest/my_organization_logo.png"), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_GIF);

        final Mono<UserData> saveMono = userDataService.saveProfilePhoto(filepart).cache();

        StepVerifier.create(saveMono)
                .expectErrorMatches(error -> error instanceof AppsmithException)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUploadProfilePhoto_invalidImageSize() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(new ClassPathResource("test_assets/OrganizationServiceTest/my_organization_logo.png"), new DefaultDataBufferFactory(), 4096)
                .repeat(70)  // So the file size looks like it's much larger than what it actually is.
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        final Mono<UserData> saveMono = userDataService.saveProfilePhoto(filepart).cache();

        StepVerifier.create(saveMono)
                .expectErrorMatches(error -> error instanceof AppsmithException)
                .verify();
    }

}
