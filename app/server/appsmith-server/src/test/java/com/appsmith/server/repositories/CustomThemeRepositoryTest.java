package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.QTheme;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.helpers.PolicyUtils;
import org.junit.After;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@RunWith(SpringRunner.class)
public class CustomThemeRepositoryTest {

    @Autowired
    ThemeRepository themeRepository;

    @Autowired
    PolicyUtils policyUtils;

    @After
    public void cleanUp() {
        // delete all themes except the system themes.
        List<Criteria> nonSystemThemesCriteria = List.of(
                Criteria.where(QTheme.theme.isSystemTheme.getMetadata().getName()).is(false)
        );
        themeRepository.queryAll(nonSystemThemesCriteria, null)
                .map(BaseDomain::getId)
                .collectList()
                .flatMap(nonSystemThemeIds -> themeRepository.deleteAllById(nonSystemThemeIds)).block();
    }

    @WithUserDetails("api_user")
    @Test
    public void getSystemThemes_WhenThemesExists_ReturnsSystemThemes() {
        String testAppId = "second-app-id";
        Theme firstAppTheme = new Theme();
        firstAppTheme.setApplicationId("first-app-id");

        Theme secondAppTheme = new Theme();
        secondAppTheme.setApplicationId(testAppId);

        Mono<List<Theme>> systemThemesMono = themeRepository.saveAll(List.of(firstAppTheme, secondAppTheme))
                .then(themeRepository.getSystemThemes().collectList());

        StepVerifier.create(systemThemesMono).assertNext(themes -> {
            assertThat(themes.size()).isEqualTo(8); // 8 system themes were created from db migration
        }).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void getApplicationThemes_WhenThemesExists_ReturnsAppThemes() {
        Map<String, Policy> themePolicies = policyUtils.generatePolicyFromPermission(Set.of(READ_THEMES), "api_user");

        String testAppId = "second-app-id";
        Theme firstAppTheme = new Theme();
        firstAppTheme.setApplicationId("first-app-id");
        firstAppTheme.setPolicies(Set.of(themePolicies.get(READ_THEMES.getValue())));

        Theme secondAppTheme = new Theme();
        secondAppTheme.setApplicationId(testAppId);
        secondAppTheme.setPolicies(Set.of(themePolicies.get(READ_THEMES.getValue())));

        Mono<List<Theme>> systemThemesMono = themeRepository.saveAll(List.of(firstAppTheme, secondAppTheme))
                .then(themeRepository.getApplicationThemes(testAppId, READ_THEMES).collectList());

        StepVerifier.create(systemThemesMono).assertNext(themes -> {
            assertThat(themes.size()).isEqualTo(9); // 8 system themes were created from db migration
        }).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void getSystemThemeByName_WhenNameMatches_ReturnsTheme() {
        StepVerifier.create(themeRepository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME))
                .assertNext(theme -> {
                    assertThat(theme.getName()).isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);
                    assertThat(theme.isSystemTheme()).isTrue();
                }).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void archiveByApplicationId_WhenThemeIsPresent_ThemeArchived() {
        Map<String, Policy> themePolicies = policyUtils.generatePolicyFromPermission(
                Set.of(MANAGE_THEMES), "api_user"
        );
        String secondAppId = "second-app-id", firstAppId = "first-app-id";

        Theme firstAppTheme = new Theme();
        firstAppTheme.setApplicationId(firstAppId);
        firstAppTheme.setPolicies(Set.of(themePolicies.get(MANAGE_THEMES.getValue())));

        Theme secondAppThemeWithPermission = new Theme();
        secondAppThemeWithPermission.setApplicationId(secondAppId);
        secondAppThemeWithPermission.setPolicies(Set.of(themePolicies.get(MANAGE_THEMES.getValue())));

        Theme secondAppThemeWithoutPermission = new Theme();
        secondAppThemeWithoutPermission.setDisplayName("secondAppThemeWithoutPermission");
        secondAppThemeWithoutPermission.setApplicationId(secondAppId);
        secondAppThemeWithoutPermission.setPolicies(Set.of(themePolicies.get(READ_THEMES.getValue())));

        Flux<Theme> existingThemesMono = themeRepository.saveAll(
                    List.of(firstAppTheme, secondAppThemeWithPermission, secondAppThemeWithoutPermission)
                )
                .then(themeRepository.archiveByApplicationId(secondAppId))
                .thenMany(themeRepository.findAll()).cache();

        Flux<Theme> systemThemesFlux = existingThemesMono.filter(Theme::isSystemTheme);
        Flux<Theme> applicationThemesFlux = existingThemesMono.filter(theme -> !theme.isSystemTheme());

        StepVerifier.create(systemThemesFlux).expectNextCount(8).verifyComplete();
        StepVerifier.create(applicationThemesFlux.collectMultimap(Theme::getApplicationId))
                .assertNext(themesListByApplicationId -> {
                    assertThat(themesListByApplicationId.size()).isEqualTo(2);
                    assertThat(themesListByApplicationId.get(firstAppId).size()).isEqualTo(1);
                    assertThat(themesListByApplicationId.get(secondAppId).size()).isEqualTo(1);
                    Theme secondAppTheme = themesListByApplicationId.get(secondAppId).iterator().next();
                    assertThat(secondAppTheme.getDisplayName()).isEqualTo("secondAppThemeWithoutPermission");
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void archiveDraftThemesById_WhenThemesPresent_ThemesArchived() {
        Map<String, Policy> themePolicies = policyUtils.generatePolicyFromPermission(
                Set.of(MANAGE_THEMES), "api_user"
        );
        Theme firstAppTheme = new Theme();
        firstAppTheme.setPolicies(Set.of(themePolicies.get(MANAGE_THEMES.getValue())));

        Flux<Theme> existingThemeFlux = themeRepository.save(firstAppTheme)
                .zipWith(themeRepository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME))
                .flatMap(themeTuple2 -> {
                    Theme customDraftTheme = themeTuple2.getT1();
                    Theme systemTheme = themeTuple2.getT2(); // this will not be deleted
                    return themeRepository.archiveDraftThemesById(customDraftTheme.getId(), systemTheme.getId());
                })
                .thenMany(themeRepository.findAll());
        // we should get 8 system themes and no custom draft theme
        StepVerifier.create(existingThemeFlux).expectNextCount(8).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void archiveDraftThemesById_WhenPermissionNotMatched_ThemesNotArchived() {
        Map<String, Policy> themePolicies = policyUtils.generatePolicyFromPermission(
                Set.of(READ_THEMES), "api_user"
        );
        Theme firstAppTheme = new Theme();
        firstAppTheme.setPolicies(Set.of(themePolicies.get(READ_THEMES.getValue())));

        Flux<Theme> existingThemeFlux = themeRepository.save(firstAppTheme)
                .zipWith(themeRepository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME))
                .flatMap(themeTuple2 -> {
                    Theme customDraftTheme = themeTuple2.getT1();
                    Theme systemTheme = themeTuple2.getT2(); // this will not be deleted
                    return themeRepository.archiveDraftThemesById(customDraftTheme.getId(), systemTheme.getId());
                })
                .thenMany(themeRepository.findAll());
        // we should get 8 system themes and one custom draft theme
        StepVerifier.create(existingThemeFlux).expectNextCount(9).verifyComplete();
    }
}