package com.appsmith.server.services;

import com.appsmith.server.constants.CommentOnboardingState;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.solutions.UserChangedHandler;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.Part;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;

@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class UserDataServiceTest {

    @Autowired
    UserService userService;

    @Autowired
    private UserDataService userDataService;

    @Autowired
    private UserDataRepository userDataRepository;

    @Autowired
    private AssetRepository assetRepository;

    @MockBean
    private UserChangedHandler userChangedHandler;

    @Autowired
    private AssetService assetService;

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
        FilePart filepart = createMockFilePart();
        Mono<Tuple2<UserData, Asset>> loadProfileImageMono = userDataService.getForUserEmail("api_user")
                .flatMap(userData -> {
                    Mono<UserData> userDataMono = Mono.just(userData);
                    if(StringUtils.isEmpty(userData.getProfilePhotoAssetId())) {
                        return userDataMono.zipWith(Mono.just(new Asset()));
                    } else {
                        return userDataMono.zipWith(assetRepository.findById(userData.getProfilePhotoAssetId()));
                    }
                });

        final Mono<UserData> saveMono = userDataService.saveProfilePhoto(filepart).cache();
        final Mono<Tuple2<UserData, Asset>> saveAndGetMono = saveMono.then(loadProfileImageMono);
        final Mono<Tuple2<UserData, Asset>> deleteAndGetMono = saveMono.then(userDataService.deleteProfilePhoto())
                .then(loadProfileImageMono);

        StepVerifier.create(saveAndGetMono)
                .assertNext(tuple -> {
                    final UserData userData = tuple.getT1();
                    assertThat(userData.getProfilePhotoAssetId()).isNotNull();

                    final Asset asset = tuple.getT2();
                    assertThat(asset).isNotNull();
                })
                .verifyComplete();

        StepVerifier.create(deleteAndGetMono)
                .assertNext(objects -> {
                    assertThat(objects.getT1().getProfilePhotoAssetId()).isNull();
                    assertThat(objects.getT2().getId()).isNull();
                })
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
                .read(new ClassPathResource("test_assets/OrganizationServiceTest/my_organization_logo_large.png"), new DefaultDataBufferFactory(), 4096)
                .repeat(100)  // So the file size looks like it's much larger than what it actually is.
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        final Mono<UserData> saveMono = userDataService.saveProfilePhoto(filepart).cache();

        StepVerifier.create(saveMono)
                .expectErrorMatches(error -> error instanceof AppsmithException)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateLastUsedOrgList_WhenListIsEmpty_orgIdPrepended() {
        String sampleOrgId = "abcd";
        final Mono<UserData> saveMono = userDataService.updateLastUsedOrgList(sampleOrgId);
        StepVerifier.create(saveMono).assertNext(userData -> {
            Assert.assertEquals(1, userData.getRecentlyUsedOrgIds().size());
            Assert.assertEquals(sampleOrgId, userData.getRecentlyUsedOrgIds().get(0));
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateLastUsedOrgList_WhenListIsNotEmpty_orgIdPrepended() {
        final Mono<UserData> resultMono = userDataService.getForCurrentUser().flatMap(userData -> {
            // Set an initial list of org ids to the current user.
            userData.setRecentlyUsedOrgIds(Arrays.asList("123", "456"));
            return userDataRepository.save(userData);
        }).flatMap(userData -> {
            // Now check whether a new org id is put at first.
            String sampleOrgId = "sample-org-id";
            return userDataService.updateLastUsedOrgList(sampleOrgId);
        });

        StepVerifier.create(resultMono).assertNext(userData -> {
            Assert.assertEquals(3, userData.getRecentlyUsedOrgIds().size());
            Assert.assertEquals("sample-org-id", userData.getRecentlyUsedOrgIds().get(0));
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteProfilePhotot_WhenExists_RemovedFromAssetAndUserData() {
        // create an asset first
        Mono<Tuple2<UserData, Asset>> tuple2Mono = assetRepository.save(new Asset(MediaType.IMAGE_PNG, new byte[10]))
                .flatMap(savedAsset ->
                        userDataService.getForCurrentUser().flatMap(userData -> {
                            userData.setProfilePhotoAssetId(savedAsset.getId());
                            return userDataRepository.save(userData);
                        }))
                .flatMap(userData -> {
                    String assetId = userData.getProfilePhotoAssetId();
                    return userDataService.deleteProfilePhoto().thenReturn(assetId);
                })
                .flatMap(assetId -> {
                    Mono<UserData> forCurrentUser = userDataService.getForCurrentUser();
                    return forCurrentUser.zipWith(assetRepository.findById(assetId).defaultIfEmpty(new Asset()));
                });

        StepVerifier.create(tuple2Mono)
                .assertNext(objects -> {
                    assertThat(objects.getT1().getProfilePhotoAssetId()).isNull();
                    assertThat(objects.getT2().getId()).isNull();
                    Mockito.verify(userChangedHandler, Mockito.times(1)).publish(
                            objects.getT1().getUserId(), null
                    );
                })
                .verifyComplete();
    }

    private FilePart createMockFilePart() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(new ClassPathResource("test_assets/OrganizationServiceTest/my_organization_logo.png"), new DefaultDataBufferFactory(), 4096).cache();
        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);
        return filepart;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveProfilePhoto_WhenPhotoUploaded_PhotoChangedEventTriggered() {
        Part mockFilePart = createMockFilePart();
        Mono<UserData> userDataMono = userDataService.saveProfilePhoto(mockFilePart);
        StepVerifier.create(userDataMono).assertNext(userData -> {
            assertThat(userData.getProfilePhotoAssetId()).isNotNull();
            Mockito.verify(userChangedHandler, Mockito.times(1)).publish(anyString(), anyString());
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void setCommentState_WhenParamIsInvalid_ThrowsException() {
        StepVerifier.create(userDataService.setCommentState(null))
                .expectError(AppsmithException.class)
                .verify();
        StepVerifier.create(userDataService.setCommentState(CommentOnboardingState.COMMENTED))
                .expectError(AppsmithException.class)
                .verify();
        StepVerifier.create(userDataService.setCommentState(CommentOnboardingState.RESOLVED))
                .expectError(AppsmithException.class)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void setCommentState_WhenParamIsValid_StateIsSet() {
        Mono<UserData> userDataMono1 = userDataService.setCommentState(CommentOnboardingState.SKIPPED).flatMap(userData ->
                userDataService.getForCurrentUser()
        );
        StepVerifier.create(userDataMono1).assertNext(userData -> {
            assertThat(userData.getCommentOnboardingState()).isEqualTo(CommentOnboardingState.SKIPPED);
        }).verifyComplete();

        Mono<UserData> userDataMono2 = userDataService.setCommentState(CommentOnboardingState.ONBOARDED).flatMap(userData ->
                userDataService.getForCurrentUser()
        );
        StepVerifier.create(userDataMono2).assertNext(userData -> {
            assertThat(userData.getCommentOnboardingState()).isEqualTo(CommentOnboardingState.ONBOARDED);
        }).verifyComplete();
    }
}
