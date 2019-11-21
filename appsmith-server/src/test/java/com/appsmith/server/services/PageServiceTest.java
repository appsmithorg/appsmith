package com.appsmith.server.services;

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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

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

    Mono<Application> applicationMono;

    @Before
    @WithMockUser(username = "api_user")
    public void setup() {
        purgeAllPages();
        Application application = new Application();
        application.setName("PageAPI-Test-Application");
        applicationMono = applicationService.create(application);
    }

    @Test
    @WithMockUser(username = "api_user")
    public void createPageWithNullName() {
        Page page = new Page();
        Mono<Page> pageMono = Mono.just(page)
                .flatMap(pageService::create);
        StepVerifier
                .create(pageMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void createPageWithNullApplication() {
        Page page = new Page();
        page.setName("Page without application");
        Mono<Page> pageMono = Mono.just(page)
                .flatMap(pageService::create);
        StepVerifier
                .create(pageMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.APPLICATIONID)))
                .verify();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void createValidPage() {
        Page testPage = new Page();
        testPage.setName("PageServiceTest TestApp");

        Mono<Page> pageMono = applicationMono
                .map(application -> {
                    testPage.setApplicationId(application.getOrganizationId());
                    return testPage;
                })
                .flatMap(pageService::create);

        StepVerifier
                .create(pageMono)
                .assertNext(page -> {
                    assertThat(page).isNotNull();
                    assertThat(page.getId()).isNotNull();
                    assertThat("PageServiceTest TestApp".equals(page.getName()));

                })
                .verifyComplete();
    }

    @After
    public void purgeAllPages() {
        pageService.deleteAll();
    }

}
