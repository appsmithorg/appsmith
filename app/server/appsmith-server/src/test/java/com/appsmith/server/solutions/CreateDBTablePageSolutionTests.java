package com.appsmith.server.solutions;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
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

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class CreateDBTablePageSolutionTests {

    @Autowired
    CreateDBTablePageSolution solution;

    @Autowired
    UserService userService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    Map<String, Object> resource = new HashMap<>();

    Organization testOrg;

    Application testApp;

    NewPage newPage;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Organization organization = new Organization();
        organization.setName("Create-DB-Table-Page-Org");
        testOrg = organizationService.create(organization).block();

        Application testApplication = new Application();
        testApplication.setName("DB-Table-Page-Test-Application");
        testApplication.setOrganizationId(testOrg.getId());
        testApp = applicationPageService.createApplication(testApplication, testOrg.getId()).block();

        resource.put("tableName", "sampleTable");
        resource.put("datasourceName", "sampleDatasource");
        resource.put("columns", List.of("id", "field1", "field2"));
        resource.put(FieldName.APPLICATION_ID, testApp.getId());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithInvalidApplicationIdTest() {
        resource.put(FieldName.APPLICATION_ID, (Collection<?>) null);
        Mono<PageDTO> resultMono = solution.createPageFromDBTable(testApp.getPages().get(0).getId(), resource);

        StepVerifier
            .create(resultMono)
            .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.APPLICATION_ID)))
            .verify();

    }
}
