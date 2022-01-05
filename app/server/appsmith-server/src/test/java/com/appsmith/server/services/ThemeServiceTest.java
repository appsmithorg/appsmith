package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.ThemeRepository;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple3;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@RunWith(SpringRunner.class)
public class ThemeServiceTest {

    @Autowired
    PolicyUtils policyUtils;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    ThemeRepository themeRepository;

    @Autowired
    private ThemeService themeService;

    private Application createApplication(String username, Set<AclPermission> permissionSet) {
        Application application = new Application();
        application.setName("ThemeTest_" + UUID.randomUUID());
        Collection<Policy> policies = policyUtils.generatePolicyFromPermission(
                permissionSet, username).values();
        application.setPolicies(Set.copyOf(policies));
        return application;
    }

    @WithUserDetails("api_user")
    @Test
    public void getApplicationTheme_WhenThemeIsSet_ThemesReturned() {
        Mono<Tuple2<Theme, Theme>> applicationThemesMono = themeRepository.getSystemThemeByName("Classic")
                .zipWith(themeRepository.getSystemThemeByName("Sharp"))
                .flatMap(themesTuple -> {
                    Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                    application.setEditModeThemeId(themesTuple.getT1().getId());
                    application.setPublishedModeThemeId(themesTuple.getT2().getId());
                    return applicationRepository.save(application);
                })
                .flatMap(application -> {
                    return Mono.zip(
                            themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT),
                            themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED)
                    );
                });

        StepVerifier.create(applicationThemesMono)
                .assertNext(themesTuple -> {
                    assertThat(themesTuple.getT1().isSystemTheme()).isTrue();
                    assertThat(themesTuple.getT1().getName()).isEqualTo("Classic");
                    assertThat(themesTuple.getT2().isSystemTheme()).isTrue();
                    assertThat(themesTuple.getT2().getName()).isEqualTo("Sharp");
                }).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void getApplicationTheme_WhenUserHasNoPermission_ExceptionThrows() {
        Mono<Tuple2<Theme, Theme>> applicationThemesMono = themeRepository.getSystemThemeByName("Classic")
                .zipWith(themeRepository.getSystemThemeByName("Sharp"))
                .flatMap(themesTuple -> {
                    Application application = createApplication("random_user", Set.of(MANAGE_APPLICATIONS));
                    application.setEditModeThemeId(themesTuple.getT1().getId());
                    application.setPublishedModeThemeId(themesTuple.getT2().getId());
                    return applicationRepository.save(application);
                })
                .flatMap(application -> {
                    return Mono.zip(
                            themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT),
                            themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED)
                    );
                });

        StepVerifier.create(applicationThemesMono)
                .expectError(AppsmithException.class)
                .verify();
    }

    @WithUserDetails("api_user")
    @Test
    public void changeCurrentTheme_WhenUserHasPermission_ThemesSetInEditMode() {
        Mono<Tuple2<Application, Application>> tuple2Mono = themeRepository.getSystemThemeByName("Classic")
                .flatMap(theme -> {
                    Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                    application.setEditModeThemeId(theme.getId());
                    application.setPublishedModeThemeId(theme.getId());
                    // setting classic theme to edit mode and published mode
                    return applicationRepository.save(application);
                })
                .zipWith(themeRepository.getSystemThemeByName("Rounded"))
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    Theme theme = tuple.getT2();
                    // now set rounded theme to edit mode
                    return themeService.changeCurrentTheme(theme.getId(), application.getId())
                            .then(applicationRepository.findById(application.getId())
                                    .zipWith(Mono.just(application)) // return updated and old application objects
                            );
                });

        StepVerifier.create(tuple2Mono).assertNext(objects -> {
            Application updatedApplication = objects.getT1();
            Application oldApplication = objects.getT2();
            // edit mode and published mode has same theme id in old application
            assertThat(oldApplication.getEditModeThemeId()).isEqualTo(oldApplication.getPublishedModeThemeId());
            // edit mode and published mode has different theme id in updated application
            assertThat(updatedApplication.getEditModeThemeId()).isNotEqualTo(updatedApplication.getPublishedModeThemeId());
            // edit mode theme id has changed from old application to new application
            assertThat(oldApplication.getEditModeThemeId()).isNotEqualTo(updatedApplication.getEditModeThemeId());
            // published mode theme id remains same in old application and new application
            assertThat(oldApplication.getPublishedModeThemeId()).isEqualTo(updatedApplication.getPublishedModeThemeId());
        }).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void changeCurrentTheme_WhenUserHasNoPermission_ThrowsException() {
        Mono<Theme> themeMono = themeRepository.getSystemThemeByName("Classic")
                .flatMap(theme -> {
                    Application application = createApplication("some_other_user", Set.of(MANAGE_APPLICATIONS));
                    application.setEditModeThemeId(theme.getId());
                    application.setPublishedModeThemeId(theme.getId());
                    // setting classic theme to edit mode and published mode
                    return applicationRepository.save(application);
                })
                .flatMap(application -> {
                    // now try to set the theme again
                    return themeService.changeCurrentTheme(application.getEditModeThemeId(), application.getId());
                });

        StepVerifier.create(themeMono).expectError(AppsmithException.class).verify();
    }

    @WithUserDetails("api_user")
    @Test
    public void cloneThemeToApplication_WhenSrcThemeIsSystemTheme_NoNewThemeCreated() {
        Application newApplication = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
        Mono<Tuple2<Theme, Theme>> newAndOldThemeMono = applicationRepository.save(newApplication)
                .zipWith(themeRepository.getSystemThemeByName("Classic"))
                .flatMap(applicationAndTheme -> {
                    Theme theme = applicationAndTheme.getT2();
                    Application application = applicationAndTheme.getT1();
                    return themeService.cloneThemeToApplication(theme.getId(), application.getId()).zipWith(Mono.just(theme));
                });

        StepVerifier.create(newAndOldThemeMono)
                .assertNext(objects -> {
                    assertThat(objects.getT1().getId()).isEqualTo(objects.getT2().getId());
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void cloneThemeToApplication_WhenSrcThemeIsCustomTheme_NewThemeCreated() {
        Application newApplication = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
        Theme customTheme = new Theme();
        customTheme.setName("custom theme");

        Mono<Tuple2<Theme, Theme>> newAndOldThemeMono = applicationRepository.save(newApplication)
                .zipWith(themeRepository.save(customTheme))
                .flatMap(applicationAndTheme -> {
                    Theme theme = applicationAndTheme.getT2();
                    Application application = applicationAndTheme.getT1();
                    return themeService.cloneThemeToApplication(theme.getId(), application.getId()).zipWith(Mono.just(theme));
                });

        StepVerifier.create(newAndOldThemeMono)
                .assertNext(objects -> {
                    assertThat(objects.getT1().getId()).isNotEqualTo(objects.getT2().getId());
                    assertThat(objects.getT1().getName()).isEqualTo(objects.getT2().getName());
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void getApplicationTheme_WhenUserHasPermission_ThemeReturned() {
        Theme customTheme = new Theme();
        customTheme.setName("custom theme for edit mode");

        Mono<Tuple2<Theme, Theme>> applicationThemesMono = themeRepository.save(customTheme)
                .zipWith(themeRepository.getSystemThemeByName("classic"))
                .flatMap(themes -> {
                    Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                    application.setEditModeThemeId(themes.getT1().getId());
                    application.setPublishedModeThemeId(themes.getT2().getId());
                    return applicationRepository.save(application);
                })
                .flatMap(application ->
                    themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT)
                            .zipWith(themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED))
                );

        StepVerifier.create(applicationThemesMono)
                .assertNext(objects -> {
                    Theme editTheme = objects.getT1();
                    Theme publishedTheme = objects.getT2();
                    assertThat(editTheme.getName()).isEqualTo(customTheme.getName());
                    assertThat(publishedTheme.getName()).isEqualToIgnoringCase("classic");
                }).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void publishTheme_WhenSystemThemeIsSet_NoNewThemeCreated() {
        Mono<Theme> classicThemeMono = themeRepository.getSystemThemeByName("classic").cache();

        Mono<Tuple2<Application, Theme>> appAndThemeTuple = classicThemeMono
                .flatMap(theme -> {
                    Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                    application.setEditModeThemeId(theme.getId());
                    application.setPublishedModeThemeId("this-id-should-be-overridden");
                    return applicationRepository.save(application);
                }).flatMap(savedApplication ->
                        themeService.publishTheme(savedApplication.getEditModeThemeId(),
                                savedApplication.getPublishedModeThemeId(), savedApplication.getId()
                        ).then(applicationRepository.findById(savedApplication.getId()))
                )
                .zipWith(classicThemeMono);

        StepVerifier.create(appAndThemeTuple)
                .assertNext(objects -> {
                    Application application = objects.getT1();
                    Theme classicSystemTheme = objects.getT2();
                    assertThat(application.getEditModeThemeId()).isEqualTo(classicSystemTheme.getId());
                    assertThat(application.getEditModeThemeId()).isEqualTo(application.getPublishedModeThemeId());
                }).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void publishTheme_WhenCustomThemeIsSet_ThemeCopiedForPublishedMode() {
        Theme customTheme = new Theme();
        customTheme.setName("my-custom-theme");

        Mono<Tuple2<Theme, Theme>> appThemesMono = themeRepository.save(customTheme)
                .zipWith(themeRepository.getSystemThemeByName("classic"))
                .flatMap(themes -> {
                    Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                    application.setEditModeThemeId(themes.getT1().getId()); // custom theme
                    application.setPublishedModeThemeId(themes.getT2().getId()); // system theme
                    return applicationRepository.save(application);
                }).flatMap(application ->
                        themeService.publishTheme(application.getEditModeThemeId(),
                                application.getPublishedModeThemeId(), application.getId()
                        ).then(Mono.zip(
                                themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT),
                                themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED)
                        ))
                );

        StepVerifier.create(appThemesMono)
                .assertNext(objects -> {
                    Theme editModeTheme = objects.getT1();
                    Theme publishedModeTheme = objects.getT2();
                    assertThat(editModeTheme.getName()).isEqualTo(publishedModeTheme.getName()); // same name
                    assertThat(editModeTheme.getId()).isNotEqualTo(publishedModeTheme.getId()); // different id
                }).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void updateTheme_WhenSystemThemeIsSet_NewThemeCreated() {
        Theme customTheme = new Theme();
        customTheme.setName("My custom theme");

        Mono<Tuple2<Theme, Theme>> appThemesMono = themeRepository.getSystemThemeByName("classic")
                .flatMap(theme -> {
                    Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                    application.setEditModeThemeId(theme.getId()); // system theme
                    application.setPublishedModeThemeId(theme.getId()); // system theme
                    return applicationRepository.save(application);
                }).flatMap(application ->
                        themeService.updateTheme(application.getId(), customTheme).then(Mono.zip(
                                themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT),
                                themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED)
                        ))
                );

        StepVerifier.create(appThemesMono)
                .assertNext(objects -> {
                    Theme editModeTheme = objects.getT1(); // should be a new theme
                    Theme publishedModeTheme = objects.getT2(); // should be the system theme
                    assertThat(editModeTheme.getName()).isEqualTo(customTheme.getName());
                    assertThat(editModeTheme.getId()).isNotEqualTo(publishedModeTheme.getId()); // different id
                    assertThat(editModeTheme.isSystemTheme()).isFalse();
                    assertThat(publishedModeTheme.isSystemTheme()).isTrue();
                    assertThat(publishedModeTheme.getName()).isEqualToIgnoringCase("classic");
                }).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void updateTheme_WhenCustomThemeIsSet_ThemeIsOverridden() {
        Theme customTheme = new Theme();
        customTheme.setName("My custom theme");
        Mono<Theme> saveCustomThemeMono = themeRepository.save(customTheme);

        Mono<Tuple3<Theme, Theme, Application>> appThemesMono = saveCustomThemeMono
                .zipWith(themeRepository.getSystemThemeByName("classic"))
                .flatMap(themes -> {
                    Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                    application.setEditModeThemeId(themes.getT1().getId()); // custom theme
                    application.setPublishedModeThemeId(themes.getT2().getId()); // system theme
                    return applicationRepository.save(application);
                }).flatMap(application -> {
                    Theme themeCustomization = new Theme();
                    themeCustomization.setName("Updated name");
                    return themeService.updateTheme(application.getId(), themeCustomization).then(Mono.zip(
                            themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT),
                            themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED),
                            Mono.just(application)
                    ));
                });

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
                    assertThat(editModeTheme.getName()).isEqualTo("Updated name");

                    assertThat(publishedModeTheme.isSystemTheme()).isTrue();
                    assertThat(publishedModeTheme.getName()).isEqualToIgnoringCase("classic");
                }).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void publishTheme_WhenNoThemeIsSet_SystemDefaultThemeIsSetToPublishedMode() {
        Mono<Theme> classicThemeMono = themeRepository.getSystemThemeByName(Theme.LEGACY_THEME_NAME);

        Mono<Tuple2<Application, Theme>> appAndThemeTuple = applicationRepository.save(
                        createApplication("api_user", Set.of(MANAGE_APPLICATIONS))
                )
                .flatMap(savedApplication ->
                        themeService.publishTheme(savedApplication.getEditModeThemeId(),
                                savedApplication.getPublishedModeThemeId(), savedApplication.getId()
                        ).then(applicationRepository.findById(savedApplication.getId()))
                )
                .zipWith(classicThemeMono);

        StepVerifier.create(appAndThemeTuple)
                .assertNext(objects -> {
                    Application application = objects.getT1();
                    Theme classicSystemTheme = objects.getT2();
                    assertThat(application.getPublishedModeThemeId()).isEqualTo(classicSystemTheme.getId());
                }).verifyComplete();
    }
}