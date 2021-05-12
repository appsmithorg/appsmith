package com.appsmith.server.solutions;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJSONFile;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
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

    @Autowired
    private UserService userService;

    private Plugin installedPlugin;

    private static class OrganizationData {
        Organization organization;
        List<Application> applications = new ArrayList<>();
        List<Datasource> datasources = new ArrayList<>();
        List<ActionDTO> actions = new ArrayList<>();
    }

    String orgId;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createExportFileTest() {
        Organization sourceOrg = new Organization();
        sourceOrg.setName("Source Org 1");

        final Mono<ApplicationJSONFile> resultMono = Mono
                .zip(
                        organizationService.create(sourceOrg),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Organization sourceOrg1 = tuple.getT1();
                    Application app1 = new Application();
                    app1.setName("awesome app");
                    app1.setOrganizationId(sourceOrg1.getId());

                    return applicationPageService.createApplication(app1);
//                    return Mono.zip(
//                            applicationPageService.createApplication(app1),
//                            organizationService.create(targetOrg)
//                    );
                })
                .flatMap(application -> {
                    //final String orgId = tuple.getT2().getId();
                    final String originalId = application.getId();
                    final String originalName = application.getName();

                    return importExportApplicationService
                            .getApplicationFileById(application.getId());
//                    Mono<Void> cloneMono = Mono.just(tuple.getT1())
//                            .map(app -> {
//                                // We reset these values here because the clone method updates them and that just messes with our test.
//                                app.setId(originalId);
//                                app.setName(originalName);
//                                return app;
//                            })
//                            .flatMap(app -> examplesOrganizationCloner.cloneApplications(orgId, Flux.fromArray(new Application[]{ app })))
//                            .then();
//                    // Clone this application into the same organization thrice.
//                    return cloneMono
//                            .then(cloneMono)
//                            .thenMany(Flux.defer(() -> applicationRepository.findByOrganizationId(orgId)));
                });

        StepVerifier.create(resultMono.log())
                .assertNext(applicationJSONFile -> {
//                    assertThat(applicationJSONFile.getDatasourceList()).isnull();
                })
                .verifyComplete();
    }

    /*
    @Test
    public void testImportApplication() {
        Organization organization = new Organization();
        organization.setName("Target Organization");
        ApplicationJSONFile applicationJSONFile = new ApplicationJSONFile();

        Mono<Application> importedApplicationMono = importExportApplicationService.importApplicationInOrganization(organization.getId(), new ApplicationJSONFile());

        StepVerifier.create(importedApplicationMono)
                .assertNext(application -> {

                })
                .verifyComplete();
    }
    */

}
