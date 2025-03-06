package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.themes.base.ThemeService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple3;
import reactor.util.function.Tuple4;
import reactor.util.function.Tuples;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.ANONYMOUS_USER;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Slf4j
public class ThemeServiceTest {

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserService userService;

    Workspace workspace;

    @Autowired
    private ThemeService themeService;

    @Autowired
    private PermissionGroupRepository permissionGroupRepository;

    @Autowired
    private UserWorkspaceService userWorkspaceService;

    @Autowired
    private ThemeRepository themeRepository;

    @Autowired
    private UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    CacheableRepositoryHelper cacheableRepositoryHelper;

    @Autowired
    SessionUserService sessionUserService;

    @BeforeEach
    public void setup() {
        Workspace workspace = new Workspace();
        workspace.setName("Theme Service Test workspace");
        this.workspace = workspaceService.create(workspace).block();
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspace.getId(), permission))
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace =
                workspaceService.archiveById(workspace.getId()).block();
    }

    private Application createApplication() {
        User currentUser = sessionUserService.getCurrentUser().block();
        Set<String> beforeCreatingApplication =
                cacheableRepositoryHelper.getPermissionGroupsOfUser(currentUser).block();
        log.info("Permission Groups for User before creating workspace: {}", beforeCreatingApplication);
        Application application = new Application();
        application.setName("ThemeTest_" + UUID.randomUUID());
        application.setWorkspaceId(this.workspace.getId());
        Application createdApplication = applicationPageService
                .createApplication(application, this.workspace.getId())
                .block();

        Set<String> afterCreatingApplication =
                cacheableRepositoryHelper.getPermissionGroupsOfUser(currentUser).block();
        log.info("Permission Groups for User after creating Application: {}", afterCreatingApplication);

        log.info("Workspace ID: {}", this.workspace.getId());
        log.info("Workspace Role Ids: {}", this.workspace.getDefaultPermissionGroups());
        log.info("Policy for created Workspace: {}", this.workspace.getPolicies());
        log.info("Application ID: {}", createdApplication.getId());
        log.info("Policies for created Application: {}", createdApplication.getPolicies());
        log.info("Current User ID: {}", currentUser.getId());

        return createdApplication;
    }

    public void replaceApiUserWithAnotherUserInWorkspace() {

        String origin = "http://random-origin.test";
        PermissionGroup adminPermissionGroup = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .collectList()
                .block()
                .get(0);

        // invite usertest to the workspace
        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(List.of("usertest@usertest.com"));
        inviteUsersDTO.setPermissionGroupId(adminPermissionGroup.getId());
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, origin).block();

        // Remove api_user from the workspace
        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setNewPermissionGroupId(null);
        updatePermissionGroupDTO.setUsername("api_user");
        userWorkspaceService
                .updatePermissionGroupForMember(workspace.getId(), updatePermissionGroupDTO, origin)
                .block();
    }

    public void addApiUserToTheWorkspaceAsAdmin() {
        String origin = "http://random-origin.test";
        PermissionGroup adminPermissionGroup = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .collectList()
                .block()
                .get(0);

        // add api_user back to the workspace
        User apiUser = userRepository.findByEmail("api_user").block();
        adminPermissionGroup.getAssignedToUserIds().add(apiUser.getId());
        permissionGroupRepository
                .save(adminPermissionGroup)
                .flatMap(
                        savedRole -> permissionGroupService.cleanPermissionGroupCacheForUsers(List.of(apiUser.getId())))
                .block();
    }

    @WithUserDetails("api_user")
    @Test
    public void getApplicationTheme_WhenThemeIsSet_ThemesReturned() {

        Theme sharpTheme = themeService.getSystemTheme("Sharp").block();
        Theme classicTheme = themeService.getSystemTheme("Classic").block();

        Application savedApplication = createApplication();

        // Apply Sharp theme to the application
        Mono<Theme> applySharpTheme = themeService.changeCurrentTheme(sharpTheme.getId(), savedApplication.getId());
        // Publish app
        Mono<Application> publishApp = applicationPageService.publish(savedApplication.getId(), TRUE);
        // apply classic theme to the application
        Mono<Theme> applyClassicTheme = themeService.changeCurrentTheme(classicTheme.getId(), savedApplication.getId());

        Mono<Tuple2<Theme, Theme>> applicationThemesMono = applySharpTheme
                .then(publishApp)
                .then(applyClassicTheme)
                .then(Mono.zip(
                        themeService.getApplicationTheme(savedApplication.getId(), ApplicationMode.EDIT, null),
                        themeService.getApplicationTheme(savedApplication.getId(), ApplicationMode.PUBLISHED, null)));

        StepVerifier.create(applicationThemesMono)
                .assertNext(themesTuple -> {
                    assertThat(themesTuple.getT1().isSystemTheme()).isTrue();
                    assertThat(themesTuple.getT1().getName()).isEqualTo("Classic");
                    assertThat(themesTuple.getT2().isSystemTheme()).isTrue();
                    assertThat(themesTuple.getT2().getName()).isEqualTo("Sharp");
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void getApplicationTheme_WhenUserHasNoPermission_ExceptionThrows() {

        Application savedApplication = createApplication();

        Theme sharpTheme = themeService.getSystemTheme("Sharp").block();
        Theme classicTheme = themeService.getSystemTheme("Classic").block();
        // Apply Sharp theme to the application
        Mono<Theme> applySharpTheme = themeService.changeCurrentTheme(sharpTheme.getId(), savedApplication.getId());
        // Publish app
        Mono<Application> publishApp = applicationPageService.publish(savedApplication.getId(), TRUE);
        // apply classic theme to the application
        Mono<Theme> applyClassicTheme = themeService.changeCurrentTheme(classicTheme.getId(), savedApplication.getId());

        // Set the themes in edit and published mode before the user is removed from the workspace
        applySharpTheme.then(publishApp).then(applyClassicTheme).block();

        replaceApiUserWithAnotherUserInWorkspace();

        // Fetch the app theme (after api_user has been removed from the workspace)
        Mono<Tuple2<Theme, Theme>> applicationThemesMono = Mono.zip(
                themeService.getApplicationTheme(savedApplication.getId(), ApplicationMode.EDIT, null),
                themeService.getApplicationTheme(savedApplication.getId(), ApplicationMode.PUBLISHED, null));

        StepVerifier.create(applicationThemesMono)
                .expectErrorMessage(
                        AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, savedApplication.getId()))
                .verify();

        addApiUserToTheWorkspaceAsAdmin();
    }

    @WithUserDetails("api_user")
    @Test
    public void getApplicationTheme_WhenNoThemeFoundWithId_DefaultThemeReturned() {
        Application savedApplication = createApplication();
        savedApplication.setPublishedModeThemeId("invalid-theme-id");
        Mono<Theme> publishedThemeMono = applicationRepository
                .save(savedApplication)
                .then(themeService.getApplicationTheme(savedApplication.getId(), ApplicationMode.PUBLISHED, null));

        StepVerifier.create(publishedThemeMono)
                .assertNext(theme -> {
                    assertThat(theme.getName()).isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void changeCurrentTheme_WhenUserHasPermission_ThemesSetInEditMode() {

        Theme classicTheme = themeService.getSystemTheme("Classic").block();
        Theme roundedTheme = themeService.getSystemTheme("Rounded").block();

        Application savedApplication = createApplication();
        // Publish app
        Application publishedApp =
                applicationPageService.publish(savedApplication.getId(), TRUE).block();

        // apply classic theme to the application
        Mono<Theme> applyClassicTheme = themeService.changeCurrentTheme(classicTheme.getId(), savedApplication.getId());
        // apply rounded theme to the application
        Mono<Theme> applyRoundedTheme = themeService.changeCurrentTheme(roundedTheme.getId(), savedApplication.getId());

        Mono<Application> applicationPostThemeUpdatesMono = applyClassicTheme
                .then(applyRoundedTheme)
                .then(applicationRepository.findById(savedApplication.getId()));

        Mono<Application> oldApplicationMono = Mono.just(publishedApp);

        StepVerifier.create(Mono.zip(applicationPostThemeUpdatesMono, oldApplicationMono))
                .assertNext(objects -> {
                    Application updatedApplication = objects.getT1();
                    Application oldApplication = objects.getT2();
                    // edit mode and published mode has same theme id in old application
                    assertThat(oldApplication.getEditModeThemeId()).isEqualTo(oldApplication.getPublishedModeThemeId());
                    // edit mode and published mode has different theme id in updated application
                    assertThat(updatedApplication.getEditModeThemeId())
                            .isNotEqualTo(updatedApplication.getPublishedModeThemeId());
                    // edit mode theme id has changed from old application to new application
                    assertThat(oldApplication.getEditModeThemeId())
                            .isNotEqualTo(updatedApplication.getEditModeThemeId());
                    // published mode theme id remains same in old application and new application
                    assertThat(oldApplication.getPublishedModeThemeId())
                            .isEqualTo(updatedApplication.getPublishedModeThemeId());
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void changeCurrentTheme_WhenUserHasNoPermission_ThrowsException() {

        Application savedApplication = createApplication();

        Theme classicTheme = themeService.getSystemTheme("Classic").block();
        // Publish app
        Mono<Application> publishApp = applicationPageService.publish(savedApplication.getId(), TRUE);
        // apply classic theme to the application
        Mono<Theme> applyClassicTheme = themeService.changeCurrentTheme(classicTheme.getId(), savedApplication.getId());

        // Set the themes in edit and published mode before the user is removed from the workspace
        applyClassicTheme.then(publishApp).block();

        replaceApiUserWithAnotherUserInWorkspace();

        // Change the app theme as api_user (after api_user has been removed from the workspace)
        Mono<Theme> changeCurrentThemeMono =
                themeService.changeCurrentTheme(savedApplication.getEditModeThemeId(), savedApplication.getId());

        StepVerifier.create(changeCurrentThemeMono)
                .expectError(AppsmithException.class)
                .verify();

        addApiUserToTheWorkspaceAsAdmin();
    }

    @WithUserDetails("api_user")
    @Test
    public void changeCurrentTheme_WhenSystemThemeSet_NoNewThemeCreated() {

        Mono<String> defaultThemeIdMono = themeService.getDefaultThemeId().cache();

        Application savedApplication = createApplication();

        Mono<Theme> applicationThemeMono = defaultThemeIdMono.flatMap(themeId -> themeService
                .changeCurrentTheme(themeId, savedApplication.getId())
                .then(themeService.getApplicationTheme(savedApplication.getId(), ApplicationMode.EDIT, null)));

        StepVerifier.create(applicationThemeMono)
                .assertNext(theme -> {
                    assertThat(theme.isSystemTheme()).isTrue();
                    assertThat(theme.getApplicationId()).isNull();
                    assertThat(theme.getWorkspaceId()).isNull();
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void changeCurrentTheme_WhenSystemThemeSetOverCustomTheme_NewThemeNotCreatedAndOldOneDeleted() {

        Application savedApplication = createApplication();

        Theme customTheme = new Theme();
        customTheme.setName("my-custom-theme");
        Mono<Theme> createAndApplyCustomThemeMono = themeService
                .persistCurrentTheme(savedApplication.getId(), null, customTheme)
                // Apply the newly created custom theme to the application
                .flatMap(theme -> themeService.changeCurrentTheme(theme.getId(), savedApplication.getId()))
                .flatMap(theme -> {
                    // Mark this custom theme as not an application theme
                    // Don't know why a theme will not be associated with an application if it is not a system theme
                    theme.setApplicationId(null);
                    return themeService.save(theme);
                });

        Mono<Theme> applyDefaultThemeMono = themeService
                .getDefaultThemeId()
                .flatMap(themeId -> themeService.changeCurrentTheme(themeId, savedApplication.getId()));

        Mono<Theme> newApplicationThemeMono = createAndApplyCustomThemeMono
                .then(applyDefaultThemeMono)
                .then(themeService.getApplicationTheme(savedApplication.getId(), ApplicationMode.EDIT, null));

        Mono<Theme> oldApplicationThemeMono = themeService
                .getThemeById(savedApplication.getEditModeThemeId(), READ_THEMES)
                .defaultIfEmpty(new Theme()); // this should be deleted, return empty theme

        StepVerifier.create(newApplicationThemeMono.zipWhen(theme -> oldApplicationThemeMono))
                .assertNext(themeTuple2 -> {
                    Theme currentTheme = themeTuple2.getT1();
                    Theme oldTheme = themeTuple2.getT2();
                    assertThat(currentTheme.isSystemTheme()).isTrue();
                    assertThat(currentTheme.getApplicationId()).isNull();
                    assertThat(currentTheme.getWorkspaceId()).isNull();
                    assertThat(oldTheme.getId())
                            .isNotNull(); // TODO : Change assertion to null if it should be deleted.
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void cloneThemeToApplication_WhenSrcThemeIsSystemTheme_NoNewThemeCreated() {

        // Create a new application with default system theme
        Application newApplication = createApplication();

        Mono<Tuple2<Theme, Theme>> newAndOldThemeMono = themeService
                .getSystemTheme("Classic")
                .flatMap(theme -> {
                    // Clone the application
                    return themeService
                            .cloneThemeToApplication(theme.getId(), newApplication)
                            .zipWith(Mono.just(theme));
                });

        StepVerifier.create(newAndOldThemeMono)
                .assertNext(objects -> {
                    assertThat(objects.getT1().getId())
                            .isEqualTo(objects.getT2().getId());
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void cloneThemeToApplication_WhenSrcThemeIsCustomTheme_NewThemeCreated() {

        Application savedApplication = createApplication();

        Theme customTheme = new Theme();
        customTheme.setName("my-custom-theme");
        Mono<Theme> createCustomThemeMono = themeService
                .persistCurrentTheme(savedApplication.getId(), null, customTheme)
                .flatMap(theme -> {
                    // Mark this custom theme as not an application theme
                    // Don't know why a theme will not be associated with an application if it is not a system theme
                    theme.setApplicationId(null);
                    return themeService.save(theme);
                });
        // Note ^ The theme is only created but not applied to the application above

        Mono<Tuple2<Theme, Theme>> newAndOldThemeMono = createCustomThemeMono.flatMap(theme -> {
            return themeService
                    .cloneThemeToApplication(theme.getId(), savedApplication)
                    .zipWith(Mono.just(theme));
        });

        StepVerifier.create(newAndOldThemeMono)
                .assertNext(objects -> {
                    assertThat(objects.getT1().getId())
                            .isNotEqualTo(objects.getT2().getId());
                    assertThat(objects.getT1().getDisplayName())
                            .isEqualTo(objects.getT2().getDisplayName());
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void cloneThemeToApplication_WhenSrcThemeIsCustomSavedTheme_NewCustomThemeCreated() {

        Application savedApplication = createApplication();

        Theme customTheme = new Theme();
        customTheme.setName("my-custom-theme");
        Mono<Theme> createCustomTheme = themeService.persistCurrentTheme(savedApplication.getId(), null, customTheme);
        // ^ This theme is created with application id set.

        Mono<Tuple2<Theme, Theme>> newAndOldThemeMono = createCustomTheme.flatMap(theme -> {
            return themeService
                    .cloneThemeToApplication(theme.getId(), savedApplication)
                    .zipWith(Mono.just(theme));
        });

        StepVerifier.create(newAndOldThemeMono)
                .assertNext(objects -> {
                    Theme clonnedTheme = objects.getT1();
                    Theme srcTheme = objects.getT2();

                    assertThat(clonnedTheme.getId()).isNotEqualTo(srcTheme.getId());
                    assertThat(clonnedTheme.getDisplayName()).isEqualTo(srcTheme.getDisplayName());
                    assertThat(clonnedTheme.getApplicationId()).isNull();
                    assertThat(clonnedTheme.getWorkspaceId()).isNull();
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void publishTheme_WhenSystemThemeIsSet_NoNewThemeCreated() {

        Application savedApplication = createApplication();

        Mono<Theme> classicThemeMono = themeService.getSystemTheme("classic").cache();

        Mono<Tuple2<Application, Theme>> appAndThemeTuple = classicThemeMono
                .flatMap(theme -> themeService.changeCurrentTheme(theme.getId(), savedApplication.getId()))
                .then(themeService.publishTheme(savedApplication.getId()))
                .then(applicationRepository.findById(savedApplication.getId()))
                .zipWith(classicThemeMono);

        StepVerifier.create(appAndThemeTuple)
                .assertNext(objects -> {
                    Application application = objects.getT1();
                    Theme classicSystemTheme = objects.getT2();
                    assertThat(application.getEditModeThemeId()).isEqualTo(classicSystemTheme.getId());
                    assertThat(application.getEditModeThemeId()).isEqualTo(application.getPublishedModeThemeId());
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void publishTheme_WhenCustomThemeIsSet_ThemeCopiedForPublishedMode() {

        Application application = createApplication();
        // Set the default system theme in view mode as well.
        applicationPageService.publish(application.getId(), TRUE).block();
        // Set a custom theme in edit mode.
        Theme customTheme = new Theme();
        customTheme.setName("my-custom-theme");
        Mono<Theme> createAndApplyCustomThemeMono = themeService
                .persistCurrentTheme(application.getId(), null, customTheme)
                .flatMap(theme -> themeService.changeCurrentTheme(theme.getId(), application.getId()));
        // publish the theme
        Mono<Theme> publishThemeMono = themeService.publishTheme(application.getId());

        Mono<Tuple2<Theme, Theme>> appThemesMono = createAndApplyCustomThemeMono
                .then(publishThemeMono)
                .then(Mono.zip(
                        themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT, null),
                        themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED, null)));

        StepVerifier.create(appThemesMono)
                .assertNext(objects -> {
                    Theme editModeTheme = objects.getT1();
                    Theme publishedModeTheme = objects.getT2();
                    assertThat(editModeTheme.getDisplayName())
                            .isEqualTo(publishedModeTheme.getDisplayName()); // same name
                    assertThat(editModeTheme.getId()).isNotEqualTo(publishedModeTheme.getId()); // different id
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void updateTheme_WhenSystemThemeIsSet_NewThemeCreated() {

        Application application = createApplication();
        Theme systemDefaultTheme = themeService
                .getThemeById(application.getEditModeThemeId(), READ_THEMES)
                .block();
        // publish the app to ensure system theme gets set
        applicationPageService.publish(application.getId(), TRUE).block();

        Theme updatesToSystemTheme = new Theme();
        updatesToSystemTheme.setDisplayName("My updates to existing system theme");

        Mono<Tuple2<Theme, Theme>> appThemesMono = themeService
                .updateTheme(application.getId(), updatesToSystemTheme)
                .then(Mono.zip(
                        themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT, null),
                        themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED, null)));

        StepVerifier.create(appThemesMono)
                .assertNext(objects -> {
                    Theme editModeTheme = objects.getT1(); // should be a new theme
                    Theme publishedModeTheme = objects.getT2(); // should be the system theme
                    assertThat(editModeTheme.getDisplayName()).isEqualTo(updatesToSystemTheme.getDisplayName());
                    assertThat(editModeTheme.getId()).isNotEqualTo(publishedModeTheme.getId()); // different id
                    assertThat(editModeTheme.isSystemTheme()).isFalse();
                    assertThat(publishedModeTheme.isSystemTheme()).isTrue();
                    assertThat(publishedModeTheme.getDisplayName())
                            .isEqualToIgnoringCase(systemDefaultTheme.getDisplayName());
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void updateTheme_WhenCustomThemeIsSet_ThemeIsOverridden() {

        Application application = createApplication();
        Theme systemDefaultTheme = themeService
                .getThemeById(application.getEditModeThemeId(), READ_THEMES)
                .block();

        String applicationId = application.getId();
        // publish the app to ensure system theme gets set
        applicationPageService.publish(application.getId(), TRUE).block();

        // Create and apply custom theme in edit mode.
        Theme customTheme = new Theme();
        customTheme.setDisplayName("My custom theme");
        themeService
                .persistCurrentTheme(application.getId(), null, customTheme)
                .flatMap(theme -> themeService.changeCurrentTheme(theme.getId(), applicationId))
                .block();
        application = applicationRepository.findById(applicationId).block();

        // Apply theme customization.
        Theme themeCustomization = new Theme();
        themeCustomization.setDisplayName("Updated name");
        Mono<Theme> updateThemeMono = themeService.updateTheme(application.getId(), themeCustomization);

        Mono<Tuple3<Theme, Theme, Application>> appThemesMono = updateThemeMono.then(Mono.zip(
                themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT, null),
                themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED, null),
                Mono.just(application)));

        StepVerifier.create(appThemesMono)
                .assertNext(objects -> {
                    Theme editModeTheme = objects.getT1(); // should be the same object
                    Theme publishedModeTheme = objects.getT2(); // should be the system theme
                    Application appBeforeUpdateTheme = objects.getT3();

                    // app should have same id, before and after for edit mode
                    assertThat(appBeforeUpdateTheme.getEditModeThemeId()).isEqualTo(editModeTheme.getId());
                    assertThat(appBeforeUpdateTheme.getPublishedModeThemeId()).isEqualTo(publishedModeTheme.getId());
                    assertThat(editModeTheme.isSystemTheme()).isFalse();
                    assertThat(editModeTheme.getId()).isNotEqualTo(publishedModeTheme.getId()); // different id
                    assertThat(editModeTheme.getDisplayName()).isEqualTo("Updated name");

                    assertThat(publishedModeTheme.isSystemTheme()).isTrue();
                    assertThat(publishedModeTheme.getDisplayName())
                            .isEqualToIgnoringCase(systemDefaultTheme.getDisplayName());
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void publishTheme_WhenNoThemeIsSet_SystemDefaultThemeIsSetToPublishedMode() {

        Application savedApplication = createApplication();

        // Set the default system theme in edit and view mode as empty strings to remove the themes.
        Application updateApp = new Application();
        updateApp.setEditModeThemeId("");
        updateApp.setPublishedModeThemeId("");
        Application appWithoutTheme = applicationRepository
                .updateById(savedApplication.getId(), updateApp, MANAGE_APPLICATIONS)
                .block();

        Application publishedApp =
                applicationPageService.publish(savedApplication.getId(), TRUE).block();

        Mono<Theme> classicThemeMono = themeRepository.getSystemThemeByName(Theme.LEGACY_THEME_NAME, READ_THEMES);

        Mono<Tuple2<Application, Theme>> appAndThemeTuple =
                Mono.just(publishedApp).zipWith(classicThemeMono);

        StepVerifier.create(appAndThemeTuple)
                .assertNext(objects -> {
                    Application application = objects.getT1();
                    Theme classicSystemTheme = objects.getT2();
                    assertThat(application.getPublishedModeThemeId()).isEqualTo(classicSystemTheme.getId());
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void publishTheme_WhenApplicationIsPublic_PublishedThemeIsPublic() {

        Application savedApplication = createApplication();

        // Set the default system theme in view mode as well.
        applicationPageService.publish(savedApplication.getId(), TRUE).block();

        // Set a custom theme in edit mode.
        Theme customTheme = new Theme();
        customTheme.setName("my-custom-theme");
        Mono<Theme> createAndApplyCustomThemeMono = themeService
                .persistCurrentTheme(savedApplication.getId(), null, customTheme)
                .flatMap(theme -> themeService.changeCurrentTheme(theme.getId(), savedApplication.getId()));

        // Make the app public.
        Mono<Application> makeAppPublicMono = applicationPageService.publish(savedApplication.getId(), TRUE);

        // Publish the theme
        Mono<Theme> publishThemeMono = themeService.publishTheme(savedApplication.getId());

        Mono<Theme> getPublishedApplicationThemeMono = themeService
                .getApplicationTheme(savedApplication.getId(), ApplicationMode.PUBLISHED, null)
                .switchIfEmpty(Mono.just(new Theme()))
                .cache();

        Mono<User> anonymousUserMono = userService.findByEmail(ANONYMOUS_USER);

        Mono<List<PermissionGroup>> anonymousUserPermissionsMono = Mono.zip(
                        getPublishedApplicationThemeMono, anonymousUserMono)
                .flatMap(tuple -> {
                    Theme theme = tuple.getT1();
                    User anonymousUser = tuple.getT2();

                    Policy readThemePolicy = theme.getPolicies().stream()
                            .filter(themePolicy -> themePolicy.getPermission().equals(READ_THEMES.getValue()))
                            .findFirst()
                            .get();

                    return permissionGroupRepository
                            .findAllById(readThemePolicy.getPermissionGroups())
                            .filter(permissionGroup ->
                                    permissionGroup.getAssignedToUserIds().contains(anonymousUser.getId()))
                            .collectList();
                });

        Mono<Theme> appThemesMono = createAndApplyCustomThemeMono
                .then(makeAppPublicMono)
                .then(publishThemeMono)
                .then(getPublishedApplicationThemeMono);

        StepVerifier.create(Mono.zip(appThemesMono, anonymousUserPermissionsMono))
                .assertNext(tuple -> {
                    Theme publishedModeTheme = tuple.getT1();
                    List<PermissionGroup> permissionGroups = tuple.getT2();

                    // Assert that the application does have a published theme
                    assertThat(publishedModeTheme.getId()).isNotNull();

                    // Assert that the published theme is accessible by anonymous user.
                    assertThat(permissionGroups.size()).isGreaterThan(0);
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void persistCurrentTheme_WhenCustomThemeIsSet_NewApplicationThemeCreated() {

        // App gets created with system theme set in it.
        Application savedApplication = createApplication();

        Theme theme = new Theme();
        theme.setDisplayName("My custom theme");
        Mono<Theme> persistCustomThemeMono = themeService
                .persistCurrentTheme(savedApplication.getId(), null, theme)
                .cache();

        Mono<Tuple4<List<Theme>, Theme, Application, Theme>> tuple4Mono = persistCustomThemeMono
                .then(themeService
                        .getApplicationThemes(savedApplication.getId(), null)
                        .collectList())
                .zipWith(persistCustomThemeMono)
                .flatMap(tuple -> {
                    List<Theme> themes = tuple.getT1();
                    Theme persistedTheme = tuple.getT2();

                    return themeService
                            .getThemeById(persistedTheme.getId(), MANAGE_THEMES)
                            .map(themeWithEditPermission ->
                                    Tuples.of(themes, persistedTheme, savedApplication, themeWithEditPermission));
                });

        StepVerifier.create(tuple4Mono)
                .assertNext(tuple4 -> {
                    List<Theme> availableThemes = tuple4.getT1();
                    Theme persistedThemeWithReadPermission = tuple4.getT2();
                    Application application = tuple4.getT3();
                    Theme persistedThemeWithEditPermission = tuple4.getT4();

                    long systemThemesCount = availableThemes.stream()
                            .filter(availableTheme -> availableTheme.isSystemTheme())
                            .count();
                    assertThat(availableThemes)
                            .hasSize((int) systemThemesCount + 1); // one custom theme + existing system themes

                    // assert permissions by asserting that the themes have been found.
                    assertThat(persistedThemeWithReadPermission.getId()).isNotNull();
                    assertThat(persistedThemeWithEditPermission.getId()).isNotNull();

                    assertThat(persistedThemeWithReadPermission.isSystemTheme()).isFalse();
                    assertThat(persistedThemeWithReadPermission.getApplicationId())
                            .isNotEmpty();
                    assertThat(persistedThemeWithReadPermission.getApplicationId())
                            .isNotEmpty(); // theme should have application id set
                    assertThat(persistedThemeWithReadPermission.getWorkspaceId())
                            .isEqualTo(this.workspace.getId()); // theme should have workspace id set
                    assertThat(application.getEditModeThemeId())
                            .isNotEqualTo(persistedThemeWithReadPermission.getId()); // a new copy should be created
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void delete_WhenSystemTheme_NotAllowed() {
        StepVerifier.create(themeService.getDefaultThemeId().flatMap(themeService::archiveById))
                .expectError(AppsmithException.class)
                .verify();
    }

    @WithUserDetails("api_user")
    @Test
    public void delete_WhenUnsavedCustomizedTheme_NotAllowed() {
        Application savedApplication = createApplication();

        Theme themeCustomization = new Theme();
        themeCustomization.setDisplayName("Updated name");
        Mono<Theme> deleteThemeMono = themeService
                .updateTheme(savedApplication.getId(), themeCustomization)
                .flatMap(customizedTheme -> themeService.archiveById(customizedTheme.getId()));

        StepVerifier.create(deleteThemeMono)
                .expectErrorMessage(AppsmithError.UNSUPPORTED_OPERATION.getMessage())
                .verify();
    }

    @WithUserDetails("api_user")
    @Test
    public void delete_WhenSavedCustomizedTheme_ThemeIsDeleted() {
        Application application = createApplication();

        Mono<Theme> deleteThemeMono = Mono.just(application)
                .flatMap(savedApplication -> {
                    Theme themeCustomization = new Theme();
                    themeCustomization.setDisplayName("Updated name");
                    return themeService.persistCurrentTheme(savedApplication.getId(), null, themeCustomization);
                })
                .flatMap(customizedTheme -> themeService
                        .archiveById(customizedTheme.getId())
                        .then(themeService.getThemeById(customizedTheme.getId(), READ_THEMES)));

        StepVerifier.create(deleteThemeMono).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void updateName_WhenSystemTheme_NotAllowed() {
        Mono<Theme> updateThemeNameMono = themeService.getDefaultThemeId().flatMap(themeId -> {
            Theme theme = new Theme();
            theme.setName("My theme");
            theme.setDisplayName("My theme");
            return themeService.updateName(themeId, theme);
        });
        StepVerifier.create(updateThemeNameMono)
                .expectError(AppsmithException.class)
                .verify();
    }

    @WithUserDetails("api_user")
    @Test
    public void updateName_WhenCustomTheme_NameUpdated() {
        Application application = createApplication();

        Mono<Theme> updateThemeNameMono = Mono.just(application)
                .flatMap(savedApplication -> {
                    Theme themeCustomization = new Theme();
                    themeCustomization.setDisplayName("old name");
                    return themeService.persistCurrentTheme(savedApplication.getId(), null, themeCustomization);
                })
                .flatMap(customizedTheme -> {
                    Theme theme = new Theme();
                    theme.setName("new name");
                    theme.setDisplayName("new display name");
                    return themeService
                            .updateName(customizedTheme.getId(), theme)
                            .then(themeService.getThemeById(customizedTheme.getId(), READ_THEMES));
                });

        StepVerifier.create(updateThemeNameMono)
                .assertNext(theme -> {
                    assertThat(theme.getName()).isEqualTo("new name");
                    assertThat(theme.getDisplayName()).isEqualTo("new display name");
                    assertThat(theme.isSystemTheme()).isFalse();
                    assertThat(theme.getApplicationId()).isNotNull();
                    assertThat(theme.getWorkspaceId()).isEqualTo(this.workspace.getId());
                    assertThat(theme.getConfig()).isNotNull();
                })
                .verifyComplete();
    }
}
