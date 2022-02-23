package com.appsmith.server.repositories;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.helpers.PolicyUtils;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@RunWith(SpringRunner.class)
public class CustomThemeRepositoryTest {

    @Autowired
    ThemeRepository themeRepository;

    @Autowired
    PolicyUtils policyUtils;

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
            assertThat(themes.size()).isEqualTo(4); // 4 system themes were created from db migration
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
            assertThat(themes.size()).isEqualTo(5); // 4 system themes were created from db migration
        }).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void getSystemThemeByName_WhenNameMatches_ReturnsTheme() {
        StepVerifier.create(themeRepository.getSystemThemeByName("classic"))
                .assertNext(theme -> {
                    assertThat(theme.getName()).isEqualTo("Classic");
                    assertThat(theme.isSystemTheme()).isTrue();
                }).verifyComplete();
    }
}