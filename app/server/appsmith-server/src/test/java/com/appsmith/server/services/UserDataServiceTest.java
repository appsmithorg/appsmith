package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.solutions.UserChangedHandler;
import org.assertj.core.api.AssertionsForClassTypes;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(SpringExtension.class)
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

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private GitService gitService;

    private Mono<User> userMono;

    private static final String DEFAULT_GIT_PROFILE = "default";

    @BeforeEach
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
                    if (StringUtils.isEmpty(userData.getProfilePhotoAssetId())) {
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
                .read(new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo.png"), new DefaultDataBufferFactory(), 4096)
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
                .read(new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo_large.png"), new DefaultDataBufferFactory(), 4096)
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
    public void updateLastUsedAppAndWorkspaceList_WhenListIsEmpty_workspaceIdPrepended() {
        String sampleWorkspaceId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setWorkspaceId(sampleWorkspaceId);

        final Mono<UserData> saveMono = userDataService.getForCurrentUser().flatMap(userData -> {
            // set recently used org ids to null
            userData.setRecentlyUsedWorkspaceIds(null);
            return userDataRepository.save(userData);
        }).then(userDataService.updateLastUsedAppAndWorkspaceList(application));

        StepVerifier.create(saveMono).assertNext(userData -> {
            assertEquals(1, userData.getRecentlyUsedWorkspaceIds().size());
            assertEquals(sampleWorkspaceId, userData.getRecentlyUsedWorkspaceIds().get(0));
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateLastUsedAppAndWorkspaceList_WhenListIsNotEmpty_workspaceIdPrepended() {
        final Mono<UserData> resultMono = userDataService.getForCurrentUser().flatMap(userData -> {
            // Set an initial list of org ids to the current user.
            userData.setRecentlyUsedWorkspaceIds(Arrays.asList("123", "456"));
            return userDataRepository.save(userData);
        }).flatMap(userData -> {
            // Now check whether a new org id is put at first.
            String sampleWorkspaceId = "sample-org-id";
            Application application = new Application();
            application.setWorkspaceId(sampleWorkspaceId);
            return userDataService.updateLastUsedAppAndWorkspaceList(application);
        });

        StepVerifier.create(resultMono).assertNext(userData -> {
            assertEquals(3, userData.getRecentlyUsedWorkspaceIds().size());
            assertEquals("sample-org-id", userData.getRecentlyUsedWorkspaceIds().get(0));
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateLastUsedAppAndOrgList_TooManyRecentIds_ListsAreTruncated() {
        String sampleWorkspaceId = "sample-org-id", sampleAppId = "sample-app-id";

        final Mono<UserData> resultMono = userDataService.getForCurrentUser().flatMap(userData -> {
            // Set an initial list of 12 org ids to the current user
            userData.setRecentlyUsedWorkspaceIds(new ArrayList<>());
            for (int i = 1; i <= 12; i++) {
                userData.getRecentlyUsedWorkspaceIds().add("org-" + i);
            }

            // Set an initial list of 22 app ids to the current user.
            userData.setRecentlyUsedAppIds(new ArrayList<>());
            for (int i = 1; i <= 22; i++) {
                userData.getRecentlyUsedAppIds().add("app-" + i);
            }
            return userDataRepository.save(userData);
        }).flatMap(userData -> {
            // Now check whether a new org id is put at first.
            Application application = new Application();
            application.setId(sampleAppId);
            application.setWorkspaceId(sampleWorkspaceId);
            return userDataService.updateLastUsedAppAndWorkspaceList(application);
        });

        StepVerifier.create(resultMono).assertNext(userData -> {
            // org id list should be truncated to 10
            assertThat(userData.getRecentlyUsedWorkspaceIds().size()).isEqualTo(10);
            assertThat(userData.getRecentlyUsedWorkspaceIds().get(0)).isEqualTo(sampleWorkspaceId);
            assertThat(userData.getRecentlyUsedWorkspaceIds().get(9)).isEqualTo("org-9");

            // app id list should be truncated to 20
            assertThat(userData.getRecentlyUsedAppIds().size()).isEqualTo(20);
            assertThat(userData.getRecentlyUsedAppIds().get(0)).isEqualTo(sampleAppId);
            assertThat(userData.getRecentlyUsedAppIds().get(19)).isEqualTo("app-19");
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void addTemplateIdToLastUsedList_WhenListIsEmpty_templateIdPrepended() {
        final Mono<UserData> saveMono = userDataService.getForCurrentUser().flatMap(userData -> {
            // set recently used template ids to null
            userData.setRecentlyUsedTemplateIds(null);
            return userDataRepository.save(userData);
        }).then(userDataService.addTemplateIdToLastUsedList("123456"));

        StepVerifier.create(saveMono).assertNext(userData -> {
            assertEquals(1, userData.getRecentlyUsedTemplateIds().size());
            assertEquals("123456", userData.getRecentlyUsedTemplateIds().get(0));
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void addTemplateIdToLastUsedList_WhenListIsNotEmpty_templateIdPrepended() {
        final Mono<UserData> resultMono = userDataService.getForCurrentUser().flatMap(userData -> {
            // Set an initial list of template ids to the current user.
            userData.setRecentlyUsedTemplateIds(Arrays.asList("123", "456"));
            return userDataRepository.save(userData);
        }).flatMap(userData -> {
            // Now check whether a new template id is put at first.
            String newTemplateId = "456";
            return userDataService.addTemplateIdToLastUsedList(newTemplateId);
        });

        StepVerifier.create(resultMono).assertNext(userData -> {
            assertEquals(2, userData.getRecentlyUsedTemplateIds().size());
            assertEquals("456", userData.getRecentlyUsedTemplateIds().get(0));
            assertEquals("123", userData.getRecentlyUsedTemplateIds().get(1));
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void addTemplateIdToLastUsedList_TooManyRecentIds_ListsAreTruncated() {
        String newTemplateId = "new-template-id";

        final Mono<UserData> resultMono = userDataService.getForCurrentUser().flatMap(userData -> {
            // Set an initial list of 12 template ids to the current user
            userData.setRecentlyUsedTemplateIds(new ArrayList<>());
            for (int i = 1; i <= 12; i++) {
                userData.getRecentlyUsedTemplateIds().add("template-" + i);
            }
            return userDataRepository.save(userData);
        }).flatMap(userData -> {
            // Now check whether a new template id is put at first.
            return userDataService.addTemplateIdToLastUsedList(newTemplateId);
        });

        StepVerifier.create(resultMono).assertNext(userData -> {
            // org id list should be truncated to 10
            assertThat(userData.getRecentlyUsedTemplateIds().size()).isEqualTo(5);
            assertThat(userData.getRecentlyUsedTemplateIds().get(0)).isEqualTo(newTemplateId);
            assertThat(userData.getRecentlyUsedTemplateIds().get(4)).isEqualTo("template-4");
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
                })
                .verifyComplete();
    }

    private FilePart createMockFilePart() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo.png"), new DefaultDataBufferFactory(), 4096).cache();
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
        }).verifyComplete();
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

        Mono<Map<String, GitProfile>> userDataMono = gitService.updateOrCreateGitProfileForCurrentUser(gitGlobalConfigDTO);
        StepVerifier
                .create(userDataMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Author Email")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveRepoLevelConfig_AuthorEmailNullAndName_SavesGitProfile() {
        GitProfile gitProfileDTO = createGitProfile(null, null);

        Mono<Map<String, GitProfile>> userDataMono = gitService.updateOrCreateGitProfileForCurrentUser(gitProfileDTO, "defaultAppId");
        StepVerifier
                .create(userDataMono)
                .assertNext(gitProfileMap -> {
                    AssertionsForClassTypes.assertThat(gitProfileMap).isNotNull();
                    AssertionsForClassTypes.assertThat(gitProfileMap.get("defaultAppId").getAuthorEmail()).isNullOrEmpty();
                    AssertionsForClassTypes.assertThat(gitProfileMap.get("defaultAppId").getAuthorName()).isNullOrEmpty();
                    AssertionsForClassTypes.assertThat(gitProfileDTO.getUseGlobalProfile()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void saveConfig_AuthorNameEmptyString_ThrowInvalidParameterError() {
        GitProfile gitGlobalConfigDTO = createGitProfile("test@appsmith.com", null);

        Mono<Map<String, GitProfile>> userDataMono = gitService.updateOrCreateGitProfileForCurrentUser(gitGlobalConfigDTO);
        StepVerifier
                .create(userDataMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Author Name")))
                .verify();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void getAndUpdateDefaultGitProfile_fallbackValueFromUserProfileIfEmpty_updateWithProfile() {

        Mono<GitProfile> gitConfigMono = gitService.getDefaultGitProfileOrCreateIfEmpty();

        Mono<User> userData = userDataService.getForCurrentUser()
                .flatMap(userData1 -> userService.getById(userData1.getUserId()));

        StepVerifier
                .create(gitConfigMono.zipWhen(gitProfile -> userData))
                .assertNext(tuple -> {
                    GitProfile gitProfile = tuple.getT1();
                    User user = tuple.getT2();
                    assertThat(gitProfile.getAuthorName()).isEqualTo(user.getName());
                    assertThat(gitProfile.getAuthorEmail()).isEqualTo(user.getEmail());
                })
                .verifyComplete();

        GitProfile gitGlobalConfigDTO = createGitProfile("test@appsmith.com", "Test 1");
        Mono<Map<String, GitProfile>> gitProfilesMono = gitService.updateOrCreateGitProfileForCurrentUser(gitGlobalConfigDTO);

        StepVerifier
                .create(gitProfilesMono)
                .assertNext(gitProfileMap -> {
                    GitProfile defaultProfile = gitProfileMap.get(DEFAULT_GIT_PROFILE);
                    AssertionsForClassTypes.assertThat(defaultProfile.getAuthorName()).isEqualTo(gitGlobalConfigDTO.getAuthorName());
                    AssertionsForClassTypes.assertThat(defaultProfile.getAuthorEmail()).isEqualTo(gitGlobalConfigDTO.getAuthorEmail());
                })
                .verifyComplete();
    }

}
