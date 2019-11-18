package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class LayoutServiceTest {
    @Autowired
    LayoutService layoutService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    PageService pageService;

    Mono<Layout> layoutMono;

    Mono<Application> applicationMono;

    @Before
    public void setup() {
        applicationMono = applicationService.findByName("LayoutServiceTest TestApplications");
    }

    @Test
    @WithMockUser(username = "api_user")
    public void createLayoutWithNullPageId() {
        Layout layout = new Layout();
        Mono<Layout> layoutMono = layoutService.createLayout(null, layout);
        StepVerifier
                .create(layoutMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGEID)))
                .verify();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void createLayoutWithInvalidPageID() {
        Layout layout = new Layout();
        String pageId = "Some random ID which can never be a page's ID";
        Mono<Layout> layoutMono = layoutService.createLayout(pageId, layout);
        StepVerifier
                .create(layoutMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGEID)))
                .verify();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void createValidLayout() {
        Layout testLayout = new Layout();
        JSONObject obj = new JSONObject();
        obj.put("key1", "value1");
        testLayout.setDsl(obj);

        Page testPage = new Page();
        testPage.setName("LayoutServiceTest createValidLayout Page");
        Mono<Page> pageMono = pageService
                .findByName(testPage.getName())
                .switchIfEmpty(applicationMono
                        .map(application -> {
                            testPage.setApplicationId(application.getId());
                            return testPage;
                        })
                        .flatMap(pageService::save));
        layoutMono = pageMono
                .flatMap(page -> layoutService.createLayout(page.getId(), testLayout));

        StepVerifier
                .create(layoutMono)
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                    assertThat(layout.getId()).isNotNull();
                    assertThat(layout.getDsl().equals(obj));
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void updateLayoutInvalidPageId() {
        Layout testLayout = new Layout();
        JSONObject obj = new JSONObject();
        obj.put("key", "value");
        testLayout.setDsl(obj);
        AtomicReference<String> pageId = new AtomicReference<>();

        Page testPage = new Page();
        testPage.setName("LayoutServiceTest updateLayoutInvalidPage");
        Mono<Page> pageMono = pageService
                .findByName(testPage.getName())
                .switchIfEmpty(applicationMono
                        .map(application -> {
                            testPage.setApplicationId(application.getId());
                            return testPage;
                        })
                        .flatMap(pageService::save));

        Layout startLayout = pageMono
                .flatMap(page -> {
                    pageId.set(page.getId());
                    return layoutService.createLayout(page.getId(), testLayout);
                }).block();

        Layout updateLayout = new Layout();
        obj = new JSONObject();
        obj.put("key", "value-updated");
        updateLayout.setDsl(obj);

        Mono<Layout> updatedLayoutMono = layoutService.updateLayout("random-impossible-id-page", startLayout.getId(), updateLayout);

        StepVerifier
                .create(updatedLayoutMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGEID + " or " + FieldName.LAYOUTID)))
                .verify();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void updateLayoutValidPageId() {
        Layout testLayout = new Layout();
        JSONObject obj = new JSONObject();
        obj.put("key", "value");
        testLayout.setDsl(obj);

        Page testPage = new Page();
        testPage.setName("validPageName");
        Page page = pageService
                .findByName(testPage.getName())
                .block();

        Layout startLayout = layoutService.createLayout(page.getId(), testLayout).block();

        Layout updateLayout = new Layout();
        JSONObject obj1 = new JSONObject();
        obj1.put("key1", "value-updated");
        updateLayout.setDsl(obj);

        Mono<Layout> updatedLayoutMono = layoutService.updateLayout(page.getId(), startLayout.getId(), updateLayout);

        StepVerifier
                .create(updatedLayoutMono)
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                    assertThat(layout.getId()).isNotNull();
                    assertThat(layout.getDsl().equals(obj1));
                })
                .verifyComplete();
    }

    @After
    public void purgePages() {
        pageService.deleteAll();
    }
}
