package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.ApplicationRepository;
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
import reactor.util.function.Tuples;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@RunWith(SpringRunner.class)
public class ThemeServiceTest {

    @Autowired
    PolicyUtils policyUtils;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    ApplicationService applicationService;

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
         Mono<Tuple2<Theme, Theme>> applicationThemesMono = themeService.getSystemTheme("Classic")
                 .zipWith(themeService.getSystemTheme("Sharp"))
                 .flatMap(themesTuple -> {
                     Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                     application.setEditModeThemeId(themesTuple.getT1().getId());
                     application.setPublishedModeThemeId(themesTuple.getT2().getId());
                     return applicationRepository.save(application);
                 })
                 .flatMap(application ->
                         Mono.zip(
                                 themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT, null),
                                 themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED, null)
                         )
                 );

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
         Mono<Tuple2<Theme, Theme>> applicationThemesMono = themeService.getSystemTheme("Classic")
                 .zipWith(themeService.getSystemTheme("Sharp"))
                 .flatMap(themesTuple -> {
                     Application application = createApplication("random_user", Set.of(MANAGE_APPLICATIONS));
                     application.setEditModeThemeId(themesTuple.getT1().getId());
                     application.setPublishedModeThemeId(themesTuple.getT2().getId());
                     return applicationRepository.save(application);
                 })
                 .flatMap(application -> Mono.zip(
                         themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT, null),
                         themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED, null)
                 ));

         StepVerifier.create(applicationThemesMono)
                 .expectError(AppsmithException.class)
                 .verify();
     }

     @WithUserDetails("api_user")
     @Test
     public void changeCurrentTheme_WhenUserHasPermission_ThemesSetInEditMode() {
         Mono<Tuple2<Application, Application>> tuple2Mono = themeService.getSystemTheme("Classic")
                 .flatMap(theme -> {
                     Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                     application.setEditModeThemeId(theme.getId());
                     application.setPublishedModeThemeId(theme.getId());
                     // setting classic theme to edit mode and published mode
                     return applicationRepository.save(application);
                 })
                 .zipWith(themeService.getSystemTheme("Rounded"))
                 .flatMap(tuple -> {
                     Application application = tuple.getT1();
                     Theme theme = tuple.getT2();
                     // now set rounded theme to edit mode
                     return themeService.changeCurrentTheme(theme.getId(), application.getId(), null)
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
         Mono<Theme> themeMono = themeService.getSystemTheme("Classic")
                 .flatMap(theme -> {
                     Application application = createApplication("some_other_user", Set.of(MANAGE_APPLICATIONS));
                     application.setEditModeThemeId(theme.getId());
                     application.setPublishedModeThemeId(theme.getId());
                     // setting classic theme to edit mode and published mode
                     return applicationRepository.save(application);
                 })
                 .flatMap(application -> {
                     // now try to set the theme again
                     return themeService.changeCurrentTheme(application.getEditModeThemeId(), application.getId(), null);
                 });

         StepVerifier.create(themeMono).expectError(AppsmithException.class).verify();
     }

     @WithUserDetails("api_user")
     @Test
     public void changeCurrentTheme_WhenSystemThemeSet_NoNewThemeCreated() {
         Mono<String> defaultThemeIdMono = themeService.getDefaultThemeId().cache();

         Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
         application.setWorkspaceId("theme-test-org-id");
         Mono<Theme> applicationThemeMono = defaultThemeIdMono
                 .flatMap(defaultThemeId -> {
                     application.setEditModeThemeId(defaultThemeId);
                     return applicationRepository.save(application);
                 })
                 .flatMap(savedApplication ->
                     defaultThemeIdMono.flatMap(themeId ->
                         themeService.changeCurrentTheme(themeId, savedApplication.getId(), null)
                                 .then(themeService.getApplicationTheme(savedApplication.getId(), ApplicationMode.EDIT, null))
                     )
                 );

         StepVerifier.create(applicationThemeMono).assertNext(theme -> {
             assertThat(theme.isSystemTheme()).isTrue();
             assertThat(theme.getApplicationId()).isNull();
             assertThat(theme.getWorkspaceId()).isNull();
         }).verifyComplete();
     }

     @WithUserDetails("api_user")
     @Test
     public void changeCurrentTheme_WhenSystemThemeSetOverCustomTheme_NewThemeNotCreatedAndOldOneDeleted() {
         Collection<Policy> themePolicies = policyUtils.generatePolicyFromPermission(
                 Set.of(MANAGE_THEMES), "api_user"
         ).values();

         Theme customTheme = new Theme();
         customTheme.setName("my-custom-theme");
         customTheme.setPolicies(Set.copyOf(themePolicies));

         Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
         application.setWorkspaceId("theme-test-org-id");

         Mono<Tuple2<Theme, Theme>> tuple2Mono = themeService.save(customTheme)
                 .flatMap(savedTheme -> {
                     application.setEditModeThemeId(savedTheme.getId());
                     return applicationRepository.save(application);
                 })
                 .flatMap(savedApplication ->
                         themeService.getDefaultThemeId()
                                 .flatMap(themeId -> themeService.changeCurrentTheme(themeId, savedApplication.getId(), null))
                                 .thenReturn(savedApplication)
                 ).flatMap(application1 ->
                         // get old theme and new
                         Mono.zip(
                                 themeService.getApplicationTheme(application1.getId(), ApplicationMode.EDIT, null),
                                 themeService.getThemeById(application1.getEditModeThemeId(), READ_THEMES)
                                         .defaultIfEmpty(new Theme()) // this should be deleted, return empty theme
                         )
                 );

         StepVerifier.create(tuple2Mono).assertNext(themeTuple2 -> {
             Theme currentTheme = themeTuple2.getT1();
             Theme oldTheme = themeTuple2.getT2();
             assertThat(currentTheme.isSystemTheme()).isTrue();
             assertThat(currentTheme.getApplicationId()).isNull();
             assertThat(currentTheme.getWorkspaceId()).isNull();
             assertThat(oldTheme.getId()).isNull();
         }).verifyComplete();
     }

     @WithUserDetails("api_user")
     @Test
     public void cloneThemeToApplication_WhenSrcThemeIsSystemTheme_NoNewThemeCreated() {
         Application newApplication = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
         Mono<Tuple2<Theme, Theme>> newAndOldThemeMono = applicationRepository.save(newApplication)
                 .zipWith(themeService.getSystemTheme("Classic"))
                 .flatMap(applicationAndTheme -> {
                     Theme theme = applicationAndTheme.getT2();
                     Application application = applicationAndTheme.getT1();
                     return themeService.cloneThemeToApplication(theme.getId(), application).zipWith(Mono.just(theme));
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
         customTheme.setDisplayName("custom theme");
         customTheme.setPolicies(Set.copyOf(
                 policyUtils.generatePolicyFromPermission(Set.of(MANAGE_THEMES), "api_user").values()
         ));

         Mono<Tuple2<Theme, Theme>> newAndOldThemeMono = applicationRepository.save(newApplication)
                 .zipWith(themeService.save(customTheme))
                 .flatMap(applicationAndTheme -> {
                     Theme theme = applicationAndTheme.getT2();
                     Application application = applicationAndTheme.getT1();
                     return themeService.cloneThemeToApplication(theme.getId(), application).zipWith(Mono.just(theme));
                 });

         StepVerifier.create(newAndOldThemeMono)
                 .assertNext(objects -> {
                     assertThat(objects.getT1().getId()).isNotEqualTo(objects.getT2().getId());
                     assertThat(objects.getT1().getDisplayName()).isEqualTo(objects.getT2().getDisplayName());
                 })
                 .verifyComplete();
     }

     @WithUserDetails("api_user")
     @Test
     public void cloneThemeToApplication_WhenSrcThemeIsCustomSavedTheme_NewCustomThemeCreated() {
         Application srcApplication = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));

         Mono<Tuple2<Theme, Theme>> newAndOldThemeMono = applicationRepository.save(srcApplication)
                 .flatMap(application -> {
                     Theme srcCustomTheme = new Theme();
                     srcCustomTheme.setDisplayName("custom theme");
                     srcCustomTheme.setApplicationId(application.getId());
                     srcCustomTheme.setPolicies(Set.copyOf(
                             policyUtils.generatePolicyFromPermission(Set.of(MANAGE_THEMES), "api_user").values()
                     ));
                     return themeService.save(srcCustomTheme);
                 })
                 .zipWith(applicationRepository.save(createApplication("api_user", Set.of(MANAGE_APPLICATIONS))))
                 .flatMap(objects -> {
                     Theme srcTheme = objects.getT1();
                     Application destApp = objects.getT2();
                     return Mono.zip(
                             themeService.cloneThemeToApplication(srcTheme.getId(), destApp),
                             Mono.just(srcTheme)
                     );
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
     public void getApplicationTheme_WhenUserHasPermission_ThemeReturned() {
         Collection<Policy> themePolicies = policyUtils.generatePolicyFromPermission(
                 Set.of(MANAGE_THEMES), "api_user"
         ).values();

         Theme customTheme = new Theme();
         customTheme.setDisplayName("custom theme for edit mode");
         customTheme.setPolicies(Set.copyOf(themePolicies));

         Mono<Tuple2<Theme, Theme>> applicationThemesMono = themeService.save(customTheme)
                 .zipWith(themeService.getSystemTheme("classic"))
                 .flatMap(themes -> {
                     Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                     application.setEditModeThemeId(themes.getT1().getId());
                     application.setPublishedModeThemeId(themes.getT2().getId());
                     return applicationRepository.save(application);
                 })
                 .flatMap(application ->
                     themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT, null)
                             .zipWith(themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED, null))
                 );

         StepVerifier.create(applicationThemesMono)
                 .assertNext(objects -> {
                     Theme editTheme = objects.getT1();
                     Theme publishedTheme = objects.getT2();
                     assertThat(editTheme.getDisplayName()).isEqualTo(customTheme.getDisplayName());
                     assertThat(publishedTheme.getDisplayName()).isEqualToIgnoringCase("classic");
                 }).verifyComplete();
     }

     @WithUserDetails("api_user")
     @Test
     public void publishTheme_WhenSystemThemeIsSet_NoNewThemeCreated() {
         Mono<Theme> classicThemeMono = themeService.getSystemTheme("classic").cache();

         Mono<Tuple2<Application, Theme>> appAndThemeTuple = classicThemeMono
                 .flatMap(theme -> {
                     Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                     application.setEditModeThemeId(theme.getId());
                     application.setPublishedModeThemeId("this-id-should-be-overridden");
                     return applicationRepository.save(application);
                 }).flatMap(savedApplication ->
                         themeService.publishTheme(savedApplication.getId())
                                 .then(applicationRepository.findById(savedApplication.getId()))
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
     public void publishTheme_WhenSystemThemeInEditModeAndCustomThemeInPublishedMode_PublishedCopyDeleted() {
         Mono<Theme> classicThemeMono = themeService.getSystemTheme("classic").cache();

         Theme customTheme = new Theme();
         customTheme.setName("published-theme-copy");
         Mono<Theme> publishedCustomThemeMono = themeService.save(customTheme);

         Mono<Theme> deletedThemeMono = classicThemeMono
                 .zipWith(publishedCustomThemeMono)
                 .flatMap(themesTuple -> {
                     Theme systemTheme = themesTuple.getT1();
                     Theme savedCustomTheme = themesTuple.getT2();
                     Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                     application.setEditModeThemeId(systemTheme.getId());
                     application.setPublishedModeThemeId(savedCustomTheme.getId());
                     return applicationRepository.save(application);
                 }).flatMap(savedApplication ->
                         themeService.publishTheme(savedApplication.getId())
                                 .then(themeService.getThemeById(savedApplication.getPublishedModeThemeId(), READ_THEMES))
                 );

         StepVerifier.create(deletedThemeMono)
                 .verifyComplete();
     }

     @WithUserDetails("api_user")
     @Test
     public void publishTheme_WhenCustomThemeIsSet_ThemeCopiedForPublishedMode() {
         Collection<Policy> themePolicies = policyUtils.generatePolicyFromPermission(
                 Set.of(MANAGE_THEMES), "api_user"
         ).values();

         Theme customTheme = new Theme();
         customTheme.setDisplayName("my-custom-theme");
         customTheme.setPolicies(Set.copyOf(themePolicies));

         Mono<Tuple2<Theme, Theme>> appThemesMono = themeService.save(customTheme)
                 .zipWith(themeService.getSystemTheme("classic"))
                 .flatMap(themes -> {
                     Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                     application.setEditModeThemeId(themes.getT1().getId()); // custom theme
                     application.setPublishedModeThemeId(themes.getT2().getId()); // system theme
                     return applicationRepository.save(application);
                 }).flatMap(application ->
                         themeService.publishTheme(application.getId()).then(Mono.zip(
                                 themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT, null),
                                 themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED, null)
                         ))
                 );

         StepVerifier.create(appThemesMono)
                 .assertNext(objects -> {
                     Theme editModeTheme = objects.getT1();
                     Theme publishedModeTheme = objects.getT2();
                     assertThat(editModeTheme.getDisplayName()).isEqualTo(publishedModeTheme.getDisplayName()); // same name
                     assertThat(editModeTheme.getId()).isNotEqualTo(publishedModeTheme.getId()); // different id
                 }).verifyComplete();
     }

     @WithUserDetails("api_user")
     @Test
     public void updateTheme_WhenSystemThemeIsSet_NewThemeCreated() {
         Theme customTheme = new Theme();
         customTheme.setDisplayName("My custom theme");

         Mono<Tuple2<Theme, Theme>> appThemesMono = themeService.getSystemTheme("classic")
                 .flatMap(theme -> {
                     Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                     application.setEditModeThemeId(theme.getId()); // system theme
                     application.setPublishedModeThemeId(theme.getId()); // system theme
                     return applicationRepository.save(application);
                 }).flatMap(application ->
                         themeService.updateTheme(application.getId(), null, customTheme).then(Mono.zip(
                                 themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT, null),
                                 themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED, null)
                         ))
                 );

         StepVerifier.create(appThemesMono)
                 .assertNext(objects -> {
                     Theme editModeTheme = objects.getT1(); // should be a new theme
                     Theme publishedModeTheme = objects.getT2(); // should be the system theme
                     assertThat(editModeTheme.getDisplayName()).isEqualTo(customTheme.getDisplayName());
                     assertThat(editModeTheme.getId()).isNotEqualTo(publishedModeTheme.getId()); // different id
                     assertThat(editModeTheme.isSystemTheme()).isFalse();
                     assertThat(publishedModeTheme.isSystemTheme()).isTrue();
                     assertThat(publishedModeTheme.getDisplayName()).isEqualToIgnoringCase("classic");
                 }).verifyComplete();
     }

     @WithUserDetails("api_user")
     @Test
     public void updateTheme_WhenCustomThemeIsSet_ThemeIsOverridden() {
         Collection<Policy> themePolicies = policyUtils.generatePolicyFromPermission(
                 Set.of(MANAGE_THEMES), "api_user"
         ).values();
         Theme customTheme = new Theme();
         customTheme.setDisplayName("My custom theme");
         customTheme.setPolicies(Set.copyOf(themePolicies));

         Mono<Theme> saveCustomThemeMono = themeService.save(customTheme);

         Mono<Tuple3<Theme, Theme, Application>> appThemesMono = saveCustomThemeMono
                 .zipWith(themeService.getSystemTheme("classic"))
                 .flatMap(themes -> {
                     Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
                     application.setEditModeThemeId(themes.getT1().getId()); // custom theme
                     application.setPublishedModeThemeId(themes.getT2().getId()); // system theme
                     return applicationRepository.save(application);
                 }).flatMap(application -> {
                     Theme themeCustomization = new Theme();
                     themeCustomization.setDisplayName("Updated name");
                     return themeService.updateTheme(application.getId(), null, themeCustomization).then(Mono.zip(
                             themeService.getApplicationTheme(application.getId(), ApplicationMode.EDIT, null),
                             themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED, null),
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
                     assertThat(editModeTheme.getDisplayName()).isEqualTo("Updated name");

                     assertThat(publishedModeTheme.isSystemTheme()).isTrue();
                     assertThat(publishedModeTheme.getDisplayName()).isEqualToIgnoringCase("classic");
                 }).verifyComplete();
     }

     @WithUserDetails("api_user")
     @Test
     public void publishTheme_WhenNoThemeIsSet_SystemDefaultThemeIsSetToPublishedMode() {
         Mono<Theme> classicThemeMono = themeService.getSystemTheme(Theme.LEGACY_THEME_NAME);

         Mono<Tuple2<Application, Theme>> appAndThemeTuple = applicationRepository.save(
                         createApplication("api_user", Set.of(MANAGE_APPLICATIONS))
                 )
                 .flatMap(savedApplication ->
                         themeService.publishTheme(savedApplication.getId())
                                 .then(applicationRepository.findById(savedApplication.getId()))
                 )
                 .zipWith(classicThemeMono);

         StepVerifier.create(appAndThemeTuple)
                 .assertNext(objects -> {
                     Application application = objects.getT1();
                     Theme classicSystemTheme = objects.getT2();
                     assertThat(application.getPublishedModeThemeId()).isEqualTo(classicSystemTheme.getId());
                 }).verifyComplete();
     }

     @WithUserDetails("api_user")
     @Test
     public void publishTheme_WhenApplicationIsPublic_PublishedThemeIsPublic() {
         Collection<Policy> themePolicies = policyUtils.generatePolicyFromPermission(
                 Set.of(MANAGE_THEMES), "api_user"
         ).values();

         Theme customTheme = new Theme();
         customTheme.setDisplayName("my-custom-theme");
         customTheme.setPolicies(Set.copyOf(themePolicies));

         Mono<Theme> appThemesMono = themeService.save(customTheme)
                 .zipWith(themeService.getSystemTheme("classic"))
                 .flatMap(themes -> {
                     Application application = createApplication("api_user",
                             Set.of(MAKE_PUBLIC_APPLICATIONS, MANAGE_APPLICATIONS));
                     application.setEditModeThemeId(themes.getT1().getId()); // custom theme
                     application.setPublishedModeThemeId(themes.getT2().getId()); // system theme
                     return applicationRepository.save(application);
                 })
                 .flatMap(application -> {
                     // make the application public
                     ApplicationAccessDTO accessDTO = new ApplicationAccessDTO();
                     accessDTO.setPublicAccess(true);
                     return applicationService.changeViewAccess(application.getId(), accessDTO);
                 })
                 .flatMap(application ->
                         themeService.publishTheme(application.getId()).then(
                                 themeService.getApplicationTheme(application.getId(), ApplicationMode.PUBLISHED, null)
                         )
                 );

         StepVerifier.create(appThemesMono)
                 .assertNext(publishedModeTheme -> {
                     Boolean permissionPresentForAnonymousUser = policyUtils.isPermissionPresentForUser(
                             publishedModeTheme.getPolicies(), READ_THEMES.getValue(), FieldName.ANONYMOUS_USER
                     );
                     assertThat(permissionPresentForAnonymousUser).isTrue();
                 }).verifyComplete();
     }

     @WithUserDetails("api_user")
     @Test
     public void persistCurrentTheme_WhenCustomThemeIsSet_NewApplicationThemeCreated() {
         Collection<Policy> themePolicies = policyUtils.generatePolicyFromPermission(
                 Set.of(MANAGE_THEMES), "api_user"
         ).values();

         Theme customTheme = new Theme();
         customTheme.setDisplayName("Classic");
         customTheme.setPolicies(Set.copyOf(themePolicies));

         Mono<Tuple3<List<Theme>, Theme, Application>> tuple3Mono = themeService.save(customTheme).flatMap(theme -> {
             Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
             application.setEditModeThemeId(theme.getId());
             application.setWorkspaceId("theme-test-org-id");
             return applicationRepository.save(application);
         }).flatMap(application -> {
             Theme theme = new Theme();
             theme.setDisplayName("My custom theme");
             return themeService.persistCurrentTheme(application.getId(), null, theme)
                     .map(theme1 -> Tuples.of(theme1, application));
         }).flatMap(persistedThemeAndApp ->
             themeService.getApplicationThemes(persistedThemeAndApp.getT2().getId(), null).collectList()
                     .map(themes -> Tuples.of(themes, persistedThemeAndApp.getT1(), persistedThemeAndApp.getT2()))
         );

         StepVerifier.create(tuple3Mono).assertNext(tuple3 -> {
             List<Theme> availableThemes = tuple3.getT1();
             Theme persistedTheme = tuple3.getT2();
             Application application = tuple3.getT3();
             assertThat(availableThemes.size()).isEqualTo(9); // one custom theme + 8 system themes
             assertThat(persistedTheme.getApplicationId()).isNotEmpty(); // theme should have application id set
             assertThat(persistedTheme.getWorkspaceId()).isEqualTo("theme-test-org-id"); // theme should have org id set
             assertThat(policyUtils.isPermissionPresentForUser(
                     persistedTheme.getPolicies(), READ_THEMES.getValue(), "api_user")
             ).isTrue();
             assertThat(policyUtils.isPermissionPresentForUser(
                     persistedTheme.getPolicies(), MANAGE_THEMES.getValue(), "api_user")
             ).isTrue();
             assertThat(application.getEditModeThemeId()).isNotEqualTo(persistedTheme.getId()); // a new copy should be created
         }).verifyComplete();
     }

     @WithUserDetails("api_user")
     @Test
     public void persistCurrentTheme_WhenSystemThemeIsSet_NewApplicationThemeCreated() {
         Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
         application.setWorkspaceId("theme-test-org-id");
         Mono<Tuple2<List<Theme>, Theme>> tuple2Mono = themeService.getDefaultThemeId()
                 .flatMap(defaultThemeId -> {
                     application.setEditModeThemeId(defaultThemeId);
                     return applicationRepository.save(application);
                 })
                 .flatMap(savedApplication -> {
                     Theme theme = new Theme();
                     theme.setDisplayName("My custom theme");
                     return themeService.persistCurrentTheme(savedApplication.getId(), null, theme)
                             .map(theme1 -> Tuples.of(theme1, savedApplication.getId()));
                 }).flatMap(persistedThemeAndAppId ->
                         themeService.getApplicationThemes(persistedThemeAndAppId.getT2(), null).collectList()
                                 .map(themes -> Tuples.of(themes, persistedThemeAndAppId.getT1()))
                 );

         StepVerifier.create(tuple2Mono).assertNext(tuple2 -> {
             List<Theme> availableThemes = tuple2.getT1();
             Theme currentTheme = tuple2.getT2();
             assertThat(availableThemes.size()).isEqualTo(9); // one custom theme + 8 system themes
             assertThat(currentTheme.isSystemTheme()).isFalse();
             assertThat(currentTheme.getApplicationId()).isNotEmpty(); // theme should have application id set
             assertThat(currentTheme.getWorkspaceId()).isEqualTo("theme-test-org-id"); // theme should have org id set
             assertThat(policyUtils.isPermissionPresentForUser(currentTheme.getPolicies(), READ_THEMES.getValue(), "api_user")).isTrue();
             assertThat(policyUtils.isPermissionPresentForUser(currentTheme.getPolicies(), MANAGE_THEMES.getValue(), "api_user")).isTrue();
         }).verifyComplete();
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
         Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));

         Mono<Theme> deleteThemeMono = themeService.getDefaultThemeId()
                 .flatMap(s -> {
                     application.setEditModeThemeId(s);
                     return applicationRepository.save(application);
                 })
                 .flatMap(savedApplication -> {
                     Theme themeCustomization = new Theme();
                     themeCustomization.setDisplayName("Updated name");
                     return themeService.updateTheme(savedApplication.getId(), null, themeCustomization);
                 }).flatMap(customizedTheme -> themeService.archiveById(customizedTheme.getId()));

         StepVerifier.create(deleteThemeMono)
                 .expectErrorMessage(AppsmithError.UNSUPPORTED_OPERATION.getMessage())
                 .verify();
     }

     @WithUserDetails("api_user")
     @Test
     public void delete_WhenSavedCustomizedTheme_ThemeIsDeleted() {
         Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));

         Mono<Theme> deleteThemeMono = themeService.getDefaultThemeId()
                 .flatMap(s -> {
                     application.setEditModeThemeId(s);
                     return applicationRepository.save(application);
                 })
                 .flatMap(savedApplication -> {
                     Theme themeCustomization = new Theme();
                     themeCustomization.setDisplayName("Updated name");
                     return themeService.persistCurrentTheme(savedApplication.getId(), null, themeCustomization);
                 })
                 .flatMap(customizedTheme -> themeService.archiveById(customizedTheme.getId())
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
         StepVerifier.create(updateThemeNameMono).expectError(AppsmithException.class).verify();
     }

     @WithUserDetails("api_user")
     @Test
     public void updateName_WhenCustomTheme_NameUpdated() {
         Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
         application.setWorkspaceId("test-org");

         Mono<Theme> updateThemeNameMono = themeService.getDefaultThemeId()
                 .flatMap(s -> {
                     application.setEditModeThemeId(s);
                     return applicationRepository.save(application);
                 })
                 .flatMap(savedApplication -> {
                     Theme themeCustomization = new Theme();
                     themeCustomization.setDisplayName("old name");
                     return themeService.persistCurrentTheme(savedApplication.getId(), null, themeCustomization);
                 })
                 .flatMap(customizedTheme -> {
                     Theme theme = new Theme();
                     theme.setName("new name");
                     theme.setDisplayName("new display name");
                     return themeService.updateName(customizedTheme.getId(), theme)
                             .then(themeService.getThemeById(customizedTheme.getId(), READ_THEMES));
                 });

         StepVerifier.create(updateThemeNameMono).assertNext(theme -> {
             assertThat(theme.getName()).isEqualTo("new name");
             assertThat(theme.getDisplayName()).isEqualTo("new display name");
             assertThat(theme.isSystemTheme()).isFalse();
             assertThat(theme.getApplicationId()).isNotNull();
             assertThat(theme.getWorkspaceId()).isEqualTo("test-org");
             assertThat(theme.getConfig()).isNotNull();
         }).verifyComplete();
     }

     @WithUserDetails("api_user")
     @Test
     public void importThemesToApplication_WhenBothImportedThemesAreCustom_NewThemesCreated() {
         Application application = createApplication("api_user", Set.of(MANAGE_APPLICATIONS));
         application.setOrganizationId("test-org");

         // create a application json with a custom theme set as both edit mode and published mode
         ApplicationJson applicationJson = new ApplicationJson();
         Theme customTheme = new Theme();
         customTheme.setName("Custom theme name");
         customTheme.setDisplayName("Custom theme display name");
         applicationJson.setEditModeTheme(customTheme);
         applicationJson.setPublishedTheme(customTheme);

         Mono<Application> applicationMono = themeService.getDefaultThemeId()
                 .flatMap(defaultThemeId -> {
                     application.setEditModeThemeId(defaultThemeId);
                     application.setPublishedModeThemeId(defaultThemeId);
                     return applicationRepository.save(application);
                 })
                 .flatMap(savedApplication ->
                         themeService.importThemesToApplication(savedApplication, applicationJson)
                                 .thenReturn(Objects.requireNonNull(savedApplication.getId()))
                 )
                 .flatMap(applicationId ->
                     applicationRepository.findById(applicationId, MANAGE_APPLICATIONS)
                 );

         StepVerifier.create(applicationMono).assertNext(app -> {
             assertThat(app.getEditModeThemeId().equals(app.getPublishedModeThemeId())).isFalse();
         }).verifyComplete();
     }

}