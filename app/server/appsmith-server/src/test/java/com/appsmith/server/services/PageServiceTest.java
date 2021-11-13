package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Policy;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.repositories.PluginRepository;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class PageServiceTest {
    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    UserService userService;

    @Autowired
    LayoutService layoutService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    PluginRepository pluginRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    PluginExecutor pluginExecutor;

    @Autowired
    LayoutActionService layoutActionService;

    Application application = null;

    String applicationId = null;

    String orgId;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        purgeAllPages();

    }

    public void setupTestApplication() {
        if (application == null) {
            User apiUser = userService.findByEmail("api_user").block();
            orgId = apiUser.getOrganizationIds().iterator().next();

            Application newApp = new Application();
            newApp.setName(UUID.randomUUID().toString());
            application = applicationPageService.createApplication(newApp, orgId).block();
            applicationId = application.getId();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullName() {
        PageDTO page = new PageDTO();
        Mono<PageDTO> pageMono = Mono.just(page)
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
        PageDTO page = new PageDTO();
        page.setName("Page without application");
        Mono<PageDTO> pageMono = Mono.just(page)
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

        PageDTO testPage = new PageDTO();
        testPage.setName("PageServiceTest TestApp");
        setupTestApplication();
        testPage.setApplicationId(application.getId());

        Mono<PageDTO> pageMono = applicationPageService.createPage(testPage);

        Object parsedJson = new JSONParser(JSONParser.MODE_PERMISSIVE).parse(FieldName.DEFAULT_PAGE_LAYOUT);
        StepVerifier
                .create(pageMono)
                .assertNext(page -> {
                    assertThat(page).isNotNull();
                    assertThat(page.getId()).isNotNull();

                    assertThat(page.getName()).isEqualTo("PageServiceTest TestApp");
                    assertThat(page.getSlug()).isEqualTo(TextUtils.makeSlug(page.getName()));

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
    public void createValidPageWithLayout() throws ParseException {
        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();

        PageDTO testPage = new PageDTO();
        testPage.setName("PageServiceTest TestApp");
        setupTestApplication();
        testPage.setApplicationId(application.getId());

        final Layout layout = new Layout();
        final JSONObject dsl = new JSONObject(Map.of("text", "{{ query1.data }}"));
        layout.setDsl(dsl);
        testPage.setLayouts(List.of(layout));

        Mono<PageDTO> pageMono = applicationPageService.createPage(testPage);

        StepVerifier
                .create(pageMono)
                .assertNext(page -> {
                    assertThat(page).isNotNull();
                    assertThat(page.getId()).isNotNull();
                    assertThat("PageServiceTest TestApp".equals(page.getName()));

                    assertThat(page.getPolicies()).isNotEmpty();
                    assertThat(page.getPolicies()).containsOnly(managePagePolicy, readPagePolicy);

                    assertThat(page.getLayouts()).isNotEmpty();
                    assertThat(page.getLayouts().get(0).getDsl()).isEqualTo(dsl);
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

        PageDTO testPage = new PageDTO();
        testPage.setName("Before Page Name Change");
        setupTestApplication();
        testPage.setApplicationId(application.getId());

        Mono<PageDTO> pageMono = applicationPageService.createPage(testPage)
                .flatMap(page -> {
                    PageDTO newPage = new PageDTO();
                    newPage.setId(page.getId());
                    newPage.setName("New Page Name");
                    return newPageService.updatePage(page.getId(), newPage);
                });

        StepVerifier
                .create(pageMono)
                .assertNext(page -> {
                    assertThat(page).isNotNull();
                    assertThat(page.getId()).isNotNull();
                    assertThat(page.getName()).isEqualTo("New Page Name");
                    assertThat(page.getSlug()).isEqualTo(TextUtils.makeSlug(page.getName()));

                    // Check for the policy object not getting overwritten during update
                    assertThat(page.getPolicies()).isNotEmpty();
                    assertThat(page.getPolicies()).containsOnly(managePagePolicy, readPagePolicy);

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void clonePage() throws ParseException {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();

        setupTestApplication();
        final String pageId = application.getPages().get(0).getId();

        final PageDTO page = newPageService.findPageById(pageId, READ_PAGES, false).block();

        ActionDTO action = new ActionDTO();
        action.setName("PageAction");
        action.setActionConfiguration(new ActionConfiguration());
        Datasource datasource = new Datasource();
        datasource.setOrganizationId(orgId);
        datasource.setName("datasource test name for page test");
        Plugin installed_plugin = pluginRepository.findByPackageName("installed-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        action.setDatasource(datasource);
        action.setExecuteOnLoad(true);

        assert page != null;
        Layout layout = page.getLayouts().get(0);
        JSONObject dsl = new JSONObject(Map.of("text", "{{ query1.data }}"));
        dsl.put("widgetName", "firstWidget");

        JSONObject dsl2 = new JSONObject();
        dsl2.put("widgetName", "Table1");
        dsl2.put("type", "TABLE_WIDGET");
        Map<String, Object> primaryColumns = new HashMap<>();
        JSONObject jsonObject = new JSONObject(Map.of("key", "value"));
        primaryColumns.put("_id", "{{ PageAction.data }}");
        primaryColumns.put("_class", jsonObject);
        dsl2.put("primaryColumns", primaryColumns);
        final ArrayList<Object> objects = new ArrayList<>();
        JSONArray temp2 = new JSONArray();
        temp2.addAll(List.of(new JSONObject(Map.of("key", "primaryColumns._id"))));
        dsl2.put("dynamicBindingPathList", temp2);
        objects.add(dsl2);
        dsl.put("children", objects);

        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        action.setPageId(page.getId());

        final LayoutDTO layoutDTO = layoutActionService.updateLayout(page.getId(), layout.getId(), layout).block();

        layoutActionService.createSingleAction(action).block();

        final Mono<PageDTO> pageMono = applicationPageService.clonePage(page.getId()).cache();

        Mono<List<NewAction>> actionsMono =
                pageMono
                        .flatMapMany(
                                page1 -> newActionService
                                        .findByPageId(page1.getId(), READ_ACTIONS))
                        .collectList();

        StepVerifier
                .create(Mono.zip(pageMono, actionsMono))
                .assertNext(tuple -> {
                    PageDTO clonedPage = tuple.getT1();
                    assertThat(clonedPage).isNotNull();
                    assertThat(clonedPage.getId()).isNotNull();
                    Assert.assertEquals(page.getName() + " Copy", clonedPage.getName());

                    assertThat(clonedPage.getPolicies()).isNotEmpty();
                    assertThat(clonedPage.getPolicies()).containsOnly(managePagePolicy, readPagePolicy);

                    assertThat(clonedPage.getLayouts()).isNotEmpty();
                    assertThat(clonedPage.getLayouts().get(0).getDsl().get("widgetName")).isEqualTo("firstWidget");
                    assertThat(clonedPage.getLayouts().get(0).getWidgetNames()).isNotEmpty();
                    assertThat(clonedPage.getLayouts().get(0).getMongoEscapedWidgetNames()).isNotEmpty();
                    assertThat(clonedPage.getLayouts().get(0).getPublishedDsl()).isNullOrEmpty();

                    // Confirm that the page action got copied as well
                    List<NewAction> actions = tuple.getT2();
                    assertThat(actions.size()).isEqualTo(1);
                    assertThat(actions.get(0).getUnpublishedAction().getName()).isEqualTo("PageAction");

                    // Confirm that executeOnLoad is cloned as well.
                    assertThat(Boolean.TRUE.equals(actions.get(0).getUnpublishedAction().getExecuteOnLoad()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void reuseDeletedPageName() {

        PageDTO testPage = new PageDTO();
        testPage.setName("reuseDeletedPageName");
        setupTestApplication();
        testPage.setApplicationId(application.getId());

        // Create Page
        PageDTO firstPage = applicationPageService.createPage(testPage).block();

        // Publish the application
        applicationPageService.publish(application.getId(), true);

        //Delete Page in edit mode
        applicationPageService.deleteUnpublishedPage(firstPage.getId()).block();

        testPage.setId(null);
        testPage.setName("New Page Name");
        // Create Second Page
        PageDTO secondPage = applicationPageService.createPage(testPage).block();

        //Update the name of the new page
        PageDTO newPage = new PageDTO();
        newPage.setId(secondPage.getId());
        newPage.setName("reuseDeletedPageName");
        Mono<PageDTO> updatePageNameMono = newPageService.updatePage(secondPage.getId(), newPage);

        StepVerifier
                .create(updatePageNameMono)
                .assertNext(page -> {
                    assertThat(page).isNotNull();
                    assertThat(page.getId()).isNotNull();
                    assertThat("reuseDeletedPageName".equals(page.getName()));

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void reOrderPageFromHighOrderToLowOrder() {

        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();
        Application newApp = new Application();
        newApp.setName(UUID.randomUUID().toString());

        application = applicationPageService.createApplication(newApp, orgId).block();
        applicationId = application.getId();
        final String[] pageIds = new String[4];

        PageDTO testPage1 = new PageDTO();
        testPage1.setName("Page2");
        testPage1.setApplicationId(applicationId);
        Mono<ApplicationPagesDTO> applicationPageReOrdered = applicationPageService.createPage(testPage1)
                .flatMap(pageDTO -> {
                    PageDTO testPage = new PageDTO();
                    testPage.setName("Page3");
                    testPage.setApplicationId(applicationId);
                    return applicationPageService.createPage(testPage);
                })
                .flatMap(pageDTO -> {
                    PageDTO testPage = new PageDTO();
                    testPage.setName("Page4");
                    testPage.setApplicationId(applicationId);
                    return applicationPageService.createPage(testPage);
                })
                .flatMap(pageDTO -> applicationService.getById(pageDTO.getApplicationId()))
                .flatMap( application -> {
                    pageIds[0] = application.getPages().get(0).getId();
                    pageIds[1] = application.getPages().get(1).getId();
                    pageIds[2] = application.getPages().get(2).getId();
                    pageIds[3] = application.getPages().get(3).getId();
                    return applicationPageService.reorderPage(application.getId(), application.getPages().get(3).getId(), 1);
                });

        StepVerifier
                .create(applicationPageReOrdered)
                .assertNext(application -> {
                    final List<PageNameIdDTO> pages = application.getPages();
                    assertThat(pages.size()).isEqualTo(4);
                    assertThat(pages.get(0).getId()).isEqualTo(pageIds[0]);
                    assertThat(pages.get(1).getId()).isEqualTo(pageIds[3]);
                    assertThat(pages.get(2).getId()).isEqualTo(pageIds[1]);
                    assertThat(pages.get(3).getId()).isEqualTo(pageIds[2]);
                } )
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value ="api_user")
    public void reOrderPageFromLowOrderToHighOrder() {

        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();
        Application newApp = new Application();
        newApp.setName(UUID.randomUUID().toString());

        application = applicationPageService.createApplication(newApp, orgId).block();
        applicationId = application.getId();
        final String[] pageIds = new String[4];

        PageDTO testPage1 = new PageDTO();
        testPage1.setName("Page2");
        testPage1.setApplicationId(applicationId);
        Mono<ApplicationPagesDTO> applicationPageReOrdered = applicationPageService.createPage(testPage1)
                .flatMap(pageDTO -> {
                    PageDTO testPage = new PageDTO();
                    testPage.setName("Page3");
                    testPage.setApplicationId(applicationId);
                    return applicationPageService.createPage(testPage);
                })
                .flatMap(pageDTO -> {
                    PageDTO testPage = new PageDTO();
                    testPage.setName("Page4");
                    testPage.setApplicationId(applicationId);
                    return applicationPageService.createPage(testPage);
                })
                .flatMap(pageDTO -> applicationService.getById(pageDTO.getApplicationId()))
                .flatMap( application -> {
                    pageIds[0] = application.getPages().get(0).getId();
                    pageIds[1] = application.getPages().get(1).getId();
                    pageIds[2] = application.getPages().get(2).getId();
                    pageIds[3] = application.getPages().get(3).getId();
                    return applicationPageService.reorderPage(application.getId(), application.getPages().get(0).getId(), 3);
                });

        StepVerifier
                .create(applicationPageReOrdered)
                .assertNext(application -> {
                    final List<PageNameIdDTO> pages = application.getPages();
                    assertThat(pages.size()).isEqualTo(4);
                    assertThat(pages.get(3).getId()).isEqualTo(pageIds[0]);
                    assertThat(pages.get(0).getId()).isEqualTo(pageIds[1]);
                    assertThat(pages.get(1).getId()).isEqualTo(pageIds[2]);
                    assertThat(pages.get(2).getId()).isEqualTo(pageIds[3]);
                } )
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void addDuplicatePageToApplication() {

        PageDTO testPage = new PageDTO();
        testPage.setName("PageServiceTest TestApp");
        setupTestApplication();
        testPage.setApplicationId(application.getId());

        Mono<PageDTO> pageMono = applicationPageService.createPage(testPage)
                .flatMap(pageDTO -> {
                    PageDTO testPage1 = new PageDTO();
                    testPage1.setName("Page3");
                    testPage1.setApplicationId(applicationId);
                    testPage1.setId(pageDTO.getId());
                    return applicationPageService.createPage(testPage1);
                });
        StepVerifier
                .create(pageMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException)
                .verify();
    }


    @After
    public void purgeAllPages() {
        newPageService.deleteAll();
    }

}
