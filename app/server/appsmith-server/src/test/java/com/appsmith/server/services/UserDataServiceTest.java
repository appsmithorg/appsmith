package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.common.CommonGitService;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.UserDataRepository;
import org.assertj.core.api.AssertionsForClassTypes;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.Part;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DirtiesContext
public class UserDataServiceTest {

    private static final String DEFAULT_GIT_PROFILE = "default";

    @Autowired
    UserService userService;

    @Autowired
    private UserDataService userDataService;

    @Autowired
    private UserDataRepository userDataRepository;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private CommonGitService commonGitService;

    private Mono<User> userMono;

    private static final int MAX_RECENT_WORKSPACES_LIMIT = 10;

    private static final int MAX_RECENT_APPLICATIONS_LIMIT = 20;

    @BeforeEach
    public void setup() {
        userMono = userService.findByEmail("usertest@usertest.com");
    }

    @Test
    public void ensureViewedReleaseVersionNotesIsSet() {
        final Mono<UserData> resultMono = userMono.flatMap(
                        user -> userDataService.ensureViewedCurrentVersionReleaseNotes(user))
                .flatMap(user -> userDataService.getForUser(user));

        StepVerifier.create(resultMono)
                .assertNext(userData -> {
                    assertThat(userData.getReleaseNotesViewedVersion()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    public void setViewedReleaseNotesVersion() {
        final Mono<UserData> resultMono = userMono.flatMap(
                        user -> userDataService.setViewedCurrentVersionReleaseNotes(user, "version-1"))
                .flatMap(user -> userDataService.getForUser(user));

        StepVerifier.create(resultMono)
                .assertNext(userData -> {
                    assertThat(userData.getReleaseNotesViewedVersion()).isEqualTo("version-1");
                })
                .verifyComplete();
    }

    @Test
    public void updateViewedReleaseNotesVersion() {
        final Mono<UserData> resultMono = userMono.flatMap(
                        user -> userDataService.setViewedCurrentVersionReleaseNotes(user, "version-1"))
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
        Mono<Tuple2<UserData, Asset>> loadProfileImageMono = userDataService
                .getForUserEmail("api_user")
                .flatMap(userData -> {
                    Mono<UserData> userDataMono = Mono.just(userData);
                    if (StringUtils.isEmpty(userData.getProfilePhotoAssetId())) {
                        return userDataMono.zipWith(Mono.just(new Asset()));
                    } else {
                        return userDataMono.zipWith(assetRepository.findById(userData.getProfilePhotoAssetId()));
                    }
                });

        final Mono<UserData> saveMono =
                userDataService.saveProfilePhoto(filepart).cache();
        final Mono<Tuple2<UserData, Asset>> saveAndGetMono = saveMono.then(loadProfileImageMono);
        final Mono<Tuple2<UserData, Asset>> deleteAndGetMono =
                saveMono.then(userDataService.deleteProfilePhoto()).then(loadProfileImageMono);

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
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo.png"),
                        new DefaultDataBufferFactory(),
                        4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_GIF);

        final Mono<UserData> saveMono =
                userDataService.saveProfilePhoto(filepart).cache();

        StepVerifier.create(saveMono)
                .expectErrorMatches(error -> error instanceof AppsmithException)
                .verify();
    }

    /*
       This test uploads an invalid image (json file for which extension has been changed to .png) and validates the upload failure
    */
    @Test
    @WithUserDetails(value = "api_user")
    public void testUploadProfilePhoto_invalidImageContent() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource("test_assets/WorkspaceServiceTest/json_file_to_png.png"),
                        new DefaultDataBufferFactory(),
                        4096)
                .cache();
        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        final Mono<UserData> saveMono =
                userDataService.saveProfilePhoto(filepart).cache();

        StepVerifier.create(saveMono)
                .expectErrorMatches(error -> error instanceof AppsmithException)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUploadProfilePhoto_invalidImageSize() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo_large.png"),
                        new DefaultDataBufferFactory(),
                        4096)
                .repeat(100) // So the file size looks like it's much larger than what it actually is.
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        final Mono<UserData> saveMono =
                userDataService.saveProfilePhoto(filepart).cache();

        StepVerifier.create(saveMono)
                .expectErrorMatches(error -> error instanceof AppsmithException)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateLastUsedAppAndWorkspaceList_WhenListIsEmpty_workspaceIdPrepended() {
        String sampleWorkspaceId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setWorkspaceId(sampleWorkspaceId);

        final Mono<UserData> saveMono = userDataService
                .getForCurrentUser()
                .flatMap(userData -> {
                    // set recently used org ids to null
                    userData.setRecentlyUsedEntityIds(null);
                    return userDataRepository.save(userData);
                })
                .then(userDataService.updateLastUsedResourceAndWorkspaceList(
                        application.getId(), sampleWorkspaceId, null));

        StepVerifier.create(saveMono)
                .assertNext(userData -> {
                    assertThat(userData.getRecentlyUsedEntityIds()).hasSize(1);
                    assertThat(userData.getRecentlyUsedEntityIds().get(0).getWorkspaceId())
                            .isEqualTo(sampleWorkspaceId);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateLastUsedAppAndWorkspaceList_WhenListIsNotEmpty_workspaceIdPrepended() {
        final Mono<UserData> resultMono = userDataService
                .getForCurrentUser()
                .flatMap(userData -> {
                    // Set an initial list of org ids to the current user.
                    List<String> recentlyUsedWorkspaceIds = List.of("123", "456");
                    userData.setRecentlyUsedWorkspaceIds(recentlyUsedWorkspaceIds);
                    List<RecentlyUsedEntityDTO> recentlyUsedEntityIds = new ArrayList<>();
                    recentlyUsedWorkspaceIds.forEach(workspaceId -> {
                        RecentlyUsedEntityDTO recentlyUsedEntityDTO = new RecentlyUsedEntityDTO();
                        recentlyUsedEntityDTO.setWorkspaceId(workspaceId);
                        recentlyUsedEntityIds.add(recentlyUsedEntityDTO);
                    });
                    userData.setRecentlyUsedEntityIds(recentlyUsedEntityIds);
                    return userDataRepository.save(userData);
                })
                .flatMap(userData -> {
                    // Now check whether a new org id is put at first.
                    String sampleWorkspaceId = "sample-org-id";
                    Application application = new Application();
                    application.setWorkspaceId(sampleWorkspaceId);
                    application.setId("sample-app-id");
                    return userDataService.updateLastUsedResourceAndWorkspaceList(
                            application.getId(), sampleWorkspaceId, null);
                });

        StepVerifier.create(resultMono)
                .assertNext(userData -> {
                    assertThat(userData.getRecentlyUsedEntityIds()).hasSize(3);
                    assertThat(userData.getRecentlyUsedEntityIds().get(0).getWorkspaceId())
                            .isEqualTo("sample-org-id");
                    assertThat(userData.getRecentlyUsedEntityIds()
                                    .get(0)
                                    .getApplicationIds()
                                    .get(0))
                            .isEqualTo("sample-app-id");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateLastUsedAppAndOrgList_TooManyRecentIds_ListsAreTruncated() {
        String sampleWorkspaceId = "sample-org-id", sampleAppId = "sample-app-id";

        final Mono<UserData> resultMono = userDataService
                .getForCurrentUser()
                .flatMap(userData -> {
                    // Set an initial list of 12 org ids to the current user
                    List<String> workspaceIds = new ArrayList<>();
                    List<RecentlyUsedEntityDTO> recentlyUsedEntityIds = new ArrayList<>();
                    for (int i = 1; i <= 12; i++) {
                        workspaceIds.add("org-" + i);
                        RecentlyUsedEntityDTO recentlyUsedEntityDTO = new RecentlyUsedEntityDTO();
                        recentlyUsedEntityDTO.setWorkspaceId("org-" + i);
                        recentlyUsedEntityIds.add(recentlyUsedEntityDTO);
                    }
                    userData.setRecentlyUsedWorkspaceIds(workspaceIds);
                    userData.setRecentlyUsedEntityIds(recentlyUsedEntityIds);

                    // Set an initial list of 22 app ids to the current user.
                    List<String> applicationIds = new ArrayList<>();
                    for (int i = 1; i <= 22; i++) {
                        applicationIds.add("app-" + i);
                    }
                    userData.setRecentlyUsedAppIds(applicationIds);
                    recentlyUsedEntityIds.get(0).setApplicationIds(applicationIds);
                    return userDataRepository.save(userData);
                })
                .flatMap(userData -> {
                    // Now check whether a new org id is put at first.
                    Application application = new Application();
                    application.setId(sampleAppId);
                    application.setWorkspaceId(sampleWorkspaceId);
                    return userDataService.updateLastUsedResourceAndWorkspaceList(
                            application.getId(), sampleWorkspaceId, null);
                })
                .cache();

        StepVerifier.create(resultMono)
                .assertNext(userData -> {
                    assertThat(userData.getRecentlyUsedEntityIds()).hasSize(MAX_RECENT_WORKSPACES_LIMIT);
                    assertThat(userData.getRecentlyUsedEntityIds().get(0).getWorkspaceId())
                            .isEqualTo(sampleWorkspaceId);
                    assertThat(userData.getRecentlyUsedEntityIds().get(9).getWorkspaceId())
                            .isEqualTo("org-9");
                    assertThat(userData.getRecentlyUsedEntityIds()
                                    .get(0)
                                    .getApplicationIds()
                                    .get(0))
                            .isEqualTo(sampleAppId);
                    assertThat(userData.getRecentlyUsedEntityIds().get(0).getApplicationIds())
                            .hasSize(1);
                    // Truncation will be applied only after the specific entry for recently used entities goes through
                    // the workflow
                    assertThat(userData.getRecentlyUsedEntityIds().get(1).getWorkspaceId())
                            .isEqualTo("org-1");
                    assertThat(userData.getRecentlyUsedEntityIds().get(1).getApplicationIds())
                            .hasSize(22);
                })
                .verifyComplete();

        // 1. Test the re-ordering of existing workspaces and apps
        // 2. Check if the application list truncation is working correctly for applications that are already present in
        // the list
        final Mono<UserData> updateRecentlyUsedEntitiesMono = resultMono.flatMap(userData -> {
            Application application = new Application();
            application.setId(sampleAppId);
            application.setWorkspaceId("org-1");
            return userDataService.updateLastUsedResourceAndWorkspaceList(application.getId(), "org-1", null);
        });

        StepVerifier.create(updateRecentlyUsedEntitiesMono)
                .assertNext(userData -> {
                    // Check whether a new org id is put at first.
                    assertThat(userData.getRecentlyUsedEntityIds().get(0).getApplicationIds())
                            .hasSize(MAX_RECENT_APPLICATIONS_LIMIT);
                    assertThat(userData.getRecentlyUsedEntityIds().get(0).getWorkspaceId())
                            .isEqualTo("org-1");
                    assertThat(userData.getRecentlyUsedEntityIds()
                                    .get(0)
                                    .getApplicationIds()
                                    .get(0))
                            .isEqualTo(sampleAppId);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteProfilePhotot_WhenExists_RemovedFromAssetAndUserData() {
        // create an asset first
        Mono<Tuple2<UserData, Asset>> tuple2Mono = assetRepository
                .save(new Asset(MediaType.IMAGE_PNG, new byte[10]))
                .flatMap(savedAsset -> userDataService.getForCurrentUser().flatMap(userData -> {
                    userData.setProfilePhotoAssetId(savedAsset.getId());
                    return userDataRepository.save(userData);
                }))
                .flatMap(userData -> {
                    String assetId = userData.getProfilePhotoAssetId();
                    return userDataService.deleteProfilePhoto().thenReturn(assetId);
                })
                .flatMap(assetId -> {
                    Mono<UserData> forCurrentUser = userDataService.getForCurrentUser();
                    return forCurrentUser.zipWith(
                            assetRepository.findById(assetId).defaultIfEmpty(new Asset()));
                });

        StepVerifier.create(tuple2Mono)
                .assertNext(objects -> {
                    assertThat(objects.getT1().getProfilePhotoAssetId()).isNull();
                    assertThat(objects.getT2().getId()).isNull();
                })
                .verifyComplete();
    }

    private FilePart createMockFilePart() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo.png"),
                        new DefaultDataBufferFactory(),
                        4096)
                .cache();
        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);
        return filepart;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveProfilePhoto_WhenPhotoUploaded_PhotoChangedEventTriggered() {
        Part mockFilePart = createMockFilePart();
        Mono<UserData> userDataMono = userDataService.saveProfilePhoto(mockFilePart);
        StepVerifier.create(userDataMono)
                .assertNext(userData -> {
                    assertThat(userData.getProfilePhotoAssetId()).isNotNull();
                })
                .verifyComplete();
    }

    // Git user profile tests
    private GitProfile createGitProfile(String commitEmail, String author) {
        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorEmail(commitEmail);
        gitProfile.setAuthorName(author);
        return gitProfile;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_AuthorEmailNull_ThrowInvalidParameterError() {
        GitProfile gitGlobalConfigDTO = createGitProfile(null, "Test 1");

        Mono<Map<String, GitProfile>> userDataMono =
                commonGitService.updateOrCreateGitProfileForCurrentUser(gitGlobalConfigDTO);
        StepVerifier.create(userDataMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Author Email")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveRepoLevelConfig_AuthorEmailNullAndName_SavesGitProfile() {
        GitProfile gitProfileDTO = createGitProfile(null, null);

        Mono<Map<String, GitProfile>> userDataMono =
                commonGitService.updateOrCreateGitProfileForCurrentUser(gitProfileDTO, "defaultAppId");
        StepVerifier.create(userDataMono)
                .assertNext(gitProfileMap -> {
                    AssertionsForClassTypes.assertThat(gitProfileMap).isNotNull();
                    AssertionsForClassTypes.assertThat(
                                    gitProfileMap.get("defaultAppId").getAuthorEmail())
                            .isNullOrEmpty();
                    AssertionsForClassTypes.assertThat(
                                    gitProfileMap.get("defaultAppId").getAuthorName())
                            .isNullOrEmpty();
                    AssertionsForClassTypes.assertThat(gitProfileDTO.getUseGlobalProfile())
                            .isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_AuthorNameEmptyString_ThrowInvalidParameterError() {
        GitProfile gitGlobalConfigDTO = createGitProfile("test@appsmith.com", null);

        Mono<Map<String, GitProfile>> userDataMono =
                commonGitService.updateOrCreateGitProfileForCurrentUser(gitGlobalConfigDTO);
        StepVerifier.create(userDataMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Author Name")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAndUpdateDefaultGitProfile_fallbackValueFromUserProfileIfEmpty_updateWithProfile() {

        Mono<GitProfile> gitConfigMono = commonGitService.getDefaultGitProfileOrCreateIfEmpty();

        Mono<User> userData = userDataService
                .getForCurrentUser()
                .flatMap(userData1 -> userService.getByIdWithoutPermissionCheck(userData1.getUserId()));

        StepVerifier.create(gitConfigMono.zipWhen(gitProfile -> userData))
                .assertNext(tuple -> {
                    GitProfile gitProfile = tuple.getT1();
                    User user = tuple.getT2();
                    assertThat(gitProfile.getAuthorName()).isEqualTo(user.getName());
                    assertThat(gitProfile.getAuthorEmail()).isEqualTo(user.getEmail());
                })
                .verifyComplete();

        GitProfile gitGlobalConfigDTO = createGitProfile("test@appsmith.com", "Test 1");
        Mono<Map<String, GitProfile>> gitProfilesMono =
                commonGitService.updateOrCreateGitProfileForCurrentUser(gitGlobalConfigDTO);

        StepVerifier.create(gitProfilesMono)
                .assertNext(gitProfileMap -> {
                    GitProfile defaultProfile = gitProfileMap.get(DEFAULT_GIT_PROFILE);
                    AssertionsForClassTypes.assertThat(defaultProfile.getAuthorName())
                            .isEqualTo(gitGlobalConfigDTO.getAuthorName());
                    AssertionsForClassTypes.assertThat(defaultProfile.getAuthorEmail())
                            .isEqualTo(gitGlobalConfigDTO.getAuthorEmail());
                })
                .verifyComplete();
    }
}
