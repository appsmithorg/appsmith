package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Page;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class PageServiceTest {
    @Autowired
    PageService pageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    Mono<Application> applicationMono;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        purgeAllPages();
        Application application = new Application();
        application.setName("PageAPI-Test-Application");
        applicationMono = applicationPageService.createApplication(application);
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
    public void createValidPage() {
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

        StepVerifier
                .create(pageMono)
                .assertNext(page -> {
                    assertThat(page).isNotNull();
                    assertThat(page.getId()).isNotNull();
                    assertThat("PageServiceTest TestApp".equals(page.getName()));
                    assertThat(page.getPolicies()).isNotEmpty();
                    assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                })
                .verifyComplete();
    }

    @After
    public void purgeAllPages() {
        pageService.deleteAll();
    }

}
    