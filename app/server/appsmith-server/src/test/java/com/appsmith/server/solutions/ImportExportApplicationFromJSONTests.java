package com.appsmith.server.solutions;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class ImportExportApplicationFromJSONTests {

    @Autowired
    private ImportExportApplicationService importExportApplicationService;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    private UserService userService;

    @Autowired
    private NewActionService newActionService;

    @Autowired
    private ActionCollectionService actionCollectionService;

    @Autowired
    private PluginRepository pluginRepository;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    private LayoutActionService layoutActionService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private NewPageRepository newPageRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private NewPageService newPageService;

    private Plugin installedPlugin;
    private String orgId;
    private String testAppId;

    private static class OrganizationData {
        Organization organization;
        List<Application> applications = new ArrayList<>();
        List<Datasource> datasources = new ArrayList<>();
        List<ActionDTO> actions = new ArrayList<>();
    }

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        installedPlugin = pluginRepository.findByPackageName("installed-plugin").block();
        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createExportAppJsonWithNoActionsTest() {

        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest TestApp");

        final Mono<ApplicationJson> resultMono = applicationPageService.createApplication(testApplication, orgId)
                .flatMap(application -> importExportApplicationService.getApplicationFileById(application.getId()));

        StepVerifier.create(resultMono)
                .assertNext(applicationJson -> {
                    Application exportedApp = applicationJson.getExportedApplication();
                    ApplicationPage defaultPageRef = exportedApp.getPages().stream().filter(page -> page.isDefault()).findAny().get();
                    List<NewPage> pageList = applicationJson.getPageList();
                    List<NewAction> actionList = applicationJson.getActionList();

                    NewPage defaultPage = pageList.get(0);

                    assertThat(exportedApp.getName()).isEqualTo("ApplicationServiceTest TestApp");
                    assertThat(exportedApp.getOrganizationId()).isNull();
                    assertThat(exportedApp.getPages().size()).isEqualTo(1);
                    assertThat(defaultPageRef.getId()).isEqualTo(pageList.get(0).getUnpublishedPage().getName());
                    assertThat(exportedApp.getPolicies().size()).isEqualTo(0);

                    assertThat(pageList.isEmpty()).isFalse();
                    assertThat(defaultPage.getApplicationId()).isEqualTo(exportedApp.getName());
                    assertThat(defaultPage.getUnpublishedPage().getLayouts().get(0).getLayoutOnLoadActions()).isNull();

                    assertThat(actionList.isEmpty()).isTrue();
                })
                .verifyComplete();
    }


}
