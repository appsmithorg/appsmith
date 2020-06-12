package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.DslActionDTO;
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
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class LayoutServiceTest {
    @Autowired
    LayoutService layoutService;

    @Autowired
    PageService pageService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    ActionService actionService;

    Mono<Layout> layoutMono;

    String orgId;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        purgeAllPages();
        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();
    }

    private void purgeAllPages() {
        pageService.deleteAll();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createLayoutWithNullPageId() {
        Layout layout = new Layout();
        Mono<Layout> layoutMono = layoutService.createLayout(null, layout);
        StepVerifier
                .create(layoutMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGE_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createLayoutWithInvalidPageID() {
        Layout layout = new Layout();
        String pageId = "Some random ID which can never be a page's ID";
        Mono<Layout> layoutMono = layoutService.createLayout(pageId, layout);
        StepVerifier
                .create(layoutMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGE_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidLayout() {
        Page testPage = new Page();
        testPage.setName("createLayoutPageName");

        Application application = new Application();
        application.setName("createValidLayout-Test-Application");
        Mono<Application> applicationMono = applicationPageService.createApplication(application, orgId);

        Mono<Page> pageMono = applicationMono
                .switchIfEmpty(Mono.error(new Exception("No application found")))
                .map(app -> {
                    testPage.setApplicationId(app.getId());
                    return testPage;
                })
                .flatMap(applicationPageService::createPage);

        Layout testLayout = new Layout();
        JSONObject obj = new JSONObject();
        obj.put("key1", "value1");
        testLayout.setDsl(obj);

        Mono<Layout> layoutMono = pageMono
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

    private Mono<Page> createPage(Application app, Page page) {
        Mono<Page> pageMono = pageService
                .findByName(page.getName())
                .switchIfEmpty(applicationPageService.createApplication(app, orgId)
                        .map(application -> {
                            log.debug("*** Created a new app: {} for page: {}", application, page);
                            log.debug("** Got applicationId: {}", application.getId());
                            page.setApplicationId(application.getId());
                            return page;
                        })
                        .flatMap(applicationPageService::createPage))
                .map(pg -> {
                    log.debug("Found the page: {}", pg);
                    return pg;
                });
        return pageMono;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateLayoutInvalidPageId() {
        Layout testLayout = new Layout();
        JSONObject obj = new JSONObject();
        obj.put("key", "value");
        testLayout.setDsl(obj);

        Page testPage = new Page();
        testPage.setName("LayoutServiceTest updateLayoutInvalidPageId");

        Layout updateLayout = new Layout();
        obj = new JSONObject();
        obj.put("key", "value-updated");
        updateLayout.setDsl(obj);

        Application app = new Application();
        app.setName("newApplication-updateLayoutInvalidPageId-Test");
        Mono<Page> pageMono = createPage(app, testPage);

        Mono<Layout> startLayoutMono = pageMono
                .switchIfEmpty(Mono.error(new Exception("No page found")))
                .flatMap(page -> layoutService.createLayout(page.getId(), testLayout));

        Mono<Layout> updatedLayoutMono = startLayoutMono.flatMap(startLayout ->
                layoutActionService.updateLayout("random-impossible-id-page", startLayout.getId(), updateLayout)
        );

        StepVerifier
                .create(updatedLayoutMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateLayoutValidPageId() {
        Layout testLayout = new Layout();
        JSONObject obj = new JSONObject();
        obj.put("key", "value");
        testLayout.setDsl(obj);

        Layout updateLayout = new Layout();
        JSONObject obj1 = new JSONObject();
        obj1.put("key1", "value-updated");
        updateLayout.setDsl(obj);

        Page testPage = new Page();
        testPage.setName("LayoutServiceTest updateLayoutValidPageId");

        Application app = new Application();
        app.setName("newApplication-updateLayoutValidPageId-Test");

        Mono<Page> pageMono = createPage(app, testPage).cache();

        Mono<Layout> startLayoutMono = pageMono.flatMap(page -> layoutService.createLayout(page.getId(), testLayout));

        Mono<Layout> updatedLayoutMono = Mono.zip(pageMono, startLayoutMono)
                .flatMap(tuple -> {
                    Page page = tuple.getT1();
                    Layout startLayout = tuple.getT2();
                    return layoutActionService.updateLayout(page.getId(), startLayout.getId(), updateLayout);
                });

        StepVerifier
                .create(updatedLayoutMono)
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                    assertThat(layout.getId()).isNotNull();
                    assertThat(layout.getDsl().equals(obj1));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getActionsExecuteOnLoad() {
        Mono<Layout> testMono = pageService
                .findByName("validPageName")
                .flatMap(page1 -> {
                    List<Mono<Action>> monos = new ArrayList<>();

                    Action action = new Action();
                    action.setName("aGetAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
                    action.setPageId(page1.getId());
                    monos.add(actionService.create(action));

                    action = new Action();
                    action.setName("aPostAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.setPageId(page1.getId());
                    monos.add(actionService.create(action));

                    action = new Action();
                    action.setName("aPostActionWithAutoExec");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.getActionConfiguration().setBody(
                            "this won't be auto-executed: {{aPostSecondaryAction.data}}, but this one will be: {{aPostTertiaryAction.data}}.");
                    action.setJsonPathKeys(Set.of("aPostSecondaryAction.data", "aPostTertiaryAction.data"));
                    action.setPageId(page1.getId());
                    action.setExecuteOnLoad(true);
                    monos.add(actionService.create(action));

                    action = new Action();
                    action.setName("aPostSecondaryAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.setPageId(page1.getId());
                    monos.add(actionService.create(action));

                    action = new Action();
                    action.setName("aPostTertiaryAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.setPageId(page1.getId());
                    action.setExecuteOnLoad(true);
                    monos.add(actionService.create(action));

                    action = new Action();
                    action.setName("aDeleteAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.DELETE);
                    action.setPageId(page1.getId());
                    monos.add(actionService.create(action));

                    return Mono.zip(monos, objects -> page1);
                })
                .zipWhen(page1 -> {
                    Layout layout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "key", "value"
                    ));
                    layout.setDsl(obj);

                    return layoutService.createLayout(page1.getId(), layout);
                })
                .flatMap(tuple2 -> {
                    final Page page1 = tuple2.getT1();
                    final Layout layout = tuple2.getT2();

                    Layout newLayout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "key", "value-updated",
                            "another", "Hello people of the {{input1.text}} planet!",
                            "dynamicGet", "some dynamic {{aGetAction.data}}",
                            "dynamicPost", "some dynamic {{aPostAction.data}}",
                            "dynamicPostWithAutoExec", "some dynamic {{aPostActionWithAutoExec.data}}",
                            "dynamicDelete", "some dynamic {{aDeleteAction.data}}"
                    ));
                    newLayout.setDsl(obj);

                    return layoutActionService.updateLayout(page1.getId(), layout.getId(), newLayout);
                });

        StepVerifier
                .create(testMono)
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                    assertThat(layout.getId()).isNotNull();
                    assertThat(layout.getDsl().get("key")).isEqualTo("value-updated");
                    assertThat(layout.getLayoutOnLoadActions()).hasSize(2);
                    assertThat(layout.getLayoutOnLoadActions().get(0).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(Set.of("aPostTertiaryAction"));
                    assertThat(layout.getLayoutOnLoadActions().get(1).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(Set.of("aGetAction", "aPostActionWithAutoExec"));
                })
                .verifyComplete();
    }

    @After
    public void purgePages() {
        pageService.deleteAll();
    }
}
