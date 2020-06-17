package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
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
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Set;

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

    Mono<Application> applicationMono;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        purgeAllPages();

        User apiUser = userService.findByEmail("api_user").block();
        String orgId = apiUser.getOrganizationIds().iterator().next();

        Application application = new Application();
        application.setName("PageAPI-Test-Application");
        applicationMono = applicationPageService.createApplication(application, orgId);
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

        Mono<Page> pageMono = applicationMono
                .map(application -> {
                    testPage.setApplicationId(application.getId());
                    return testPage;
                })
                .flatMap(applicationPageService::createPage);

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

    @After
    public void purgeAllPages() {
        pageService.deleteAll();
    }

}
    