package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.configurations.WithMockAppsmithUser;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class PageServiceTest {
    @Autowired
    PageService pageService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    ApplicationService applicationService;

    Application application = null;

    String applicationId = null;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        purgeAllPages();

    }

    public void setupTestApplication() {
        if (application == null) {
            User apiUser = userService.findByEmail("api_user").block();
            String orgId = apiUser.getOrganizationIds().iterator().next();

            Application newApp = new Application();
            newApp.setName(UUID.randomUUID().toString());
            application = applicationPageService.createApplication(newApp, orgId).block();
            applicationId = application.getId();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullName() {
        Page page = new Page();
        Mono<Page> pageMono = Mono.just(page)
                .flatMap(applicationPageService::createPage);
        StepVerifier
                .create(pageMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullApplication() {
        Page page = new Page();
        page.setName("Page without application");
        Mono<Page> pageMono = Mono.just(page)
                .flatMap(applicationPageService::createPage);
        StepVerifier
                .create(pageMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.APPLICATION_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidPage() throws ParseException {
        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();

        Page testPage = new Page();
        testPage.setName("PageServiceTest TestApp");
        setupTestApplication();
        testPage.setApplicationId(application.getId());

        Mono<Page> pageMono = applicationPageService.createPage(testPage);

        Object parsedJson = new JSONParser(JSONParser.MODE_PERMISSIVE).parse(FieldName.DEFAULT_PAGE_LAYOUT);
        StepVerifier
                .create(pageMono)
                .assertNext(page -> {
                    assertThat(page).isNotNull();
                    assertThat(page.getId()).isNotNull();
                    assertThat("PageServiceTest TestApp".equals(page.getName()));

                    assertThat(page.getPolicies()).isNotEmpty();
                    assertThat(page.getPolicies()).containsOnly(managePagePolicy, readPagePolicy);

                    assertThat(page.getLayouts()).isNotEmpty();
                    assertThat(page.getLayouts().get(0).getDsl()).isEqualTo(parsedJson);
                    assertThat(page.getLayouts().get(0).getWidgetNames()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validChangePageName() {
        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();

        Page testPage = new Page();
        testPage.setName("Before Page Name Change");
        setupTestApplication();
        testPage.setApplicationId(application.getId());

        Mono<Page> pageMono = applicationPageService.createPage(testPage)
                .flatMap(page -> {
                    Page newPage = new Page();
                    newPage.setId(page.getId());
                    newPage.setName("New Page Name");
                    return pageService.update(page.getId(), newPage);
                });

        StepVerifier
                .create(pageMono)
                .assertNext(page -> {
                    assertThat(page).isNotNull();
                    assertThat(page.getId()).isNotNull();
                    assertThat("New Page Name".equals(page.getName()));

                    // Check for the policy object not getting overwritten during update
                    assertThat(page.getPolicies()).isNotEmpty();
                    assertThat(page.getPolicies()).containsOnly(managePagePolicy, readPagePolicy);

                })
                .verifyComplete();
    }

    @After
    public void purgeAllPages() {
        pageService.deleteAll();
    }

}
    