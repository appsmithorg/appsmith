package com.appsmith.server.solutions;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
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
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Always run the complete test suite here as TCs have dependency between them. We are controlling this with
 * FixMethodOrder(MethodSorters.NAME_ASCENDING) to run the TCs in a sequence. Running TC in a sequence is a bad
 * practice for unit TCs but here we are actually executing a integration test where we are first inviting user and then
 * forking the application
 *
 */
@Slf4j
@RunWith(SpringRunner.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
@SpringBootTest
@DirtiesContext
public class ApplicationForkingServiceTests {

    @Autowired
    private ApplicationForkingService applicationForkingService;

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

    @Autowired
    private EncryptionService encryptionService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    private LayoutActionService layoutActionService;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private UserService userService;

    private static String sourceAppId;

    private static String testUserOrgId;

    private static boolean isSetupDone = false;

    @Before
    public void setup() {

        // Run setup only once
        if (isSetupDone) {
            return;
        }

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Organization sourceOrganization = new Organization();
        sourceOrganization.setName("Source Organization");
        organizationService.create(sourceOrganization).map(Organization::getId).block();

        Application app1 = new Application();
        app1.setName("1 - public app");
        app1.setOrganizationId(sourceOrganization.getId());
        app1.setForkingEnabled(true);
        applicationPageService.createApplication(app1).block();
        sourceAppId = app1.getId();

        // Invite "usertest@usertest.com" with VIEW access, api_user will be the admin of sourceOrganization and we are
        // controlling this with @FixMethodOrder(MethodSorters.NAME_ASCENDING) to run the TCs in a sequence.
        // Running TC in a sequence is a bad practice for unit TCs but here we are testing the invite user and then fork
        // application as a part of this flow.
        // We need to test with VIEW user access so that any user should be able to fork template applications
        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> users = new ArrayList<>();
        users.add("usertest@usertest.com");
        inviteUsersDTO.setUsernames(users);
        inviteUsersDTO.setOrgId(sourceOrganization.getId());
        inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_VIEWER.getName());
        userService.inviteUsers(inviteUsersDTO, "http://localhost:8080").block();

        isSetupDone = true;
    }

    private static class OrganizationData {
        Organization organization;
        List<Application> applications = new ArrayList<>();
        List<Datasource> datasources = new ArrayList<>();
        List<ActionDTO> actions = new ArrayList<>();
    }

    public Mono<OrganizationData> loadOrganizationData(Organization organization) {
        final OrganizationData data = new OrganizationData();
        data.organization = organization;

        return Mono
                .when(
                        applicationService
                                .findByOrganizationId(organization.getId(), READ_APPLICATIONS)
                                .map(data.applications::add),
                        datasourceService
                                .findAllByOrganizationId(organization.getId(), READ_DATASOURCES)
                                .map(data.datasources::add),
                        getActionsInOrganization(organization)
                                .map(data.actions::add)
                )
                .thenReturn(data);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test1_cloneOrganizationWithItsContents() {

        Organization targetOrganization = new Organization();
        targetOrganization.setName("Target Organization");

        final Mono<Application> resultMono = organizationService.create(targetOrganization)
                .map(Organization::getId)
                .flatMap(targetOrganizationId ->
                        applicationForkingService.forkApplicationToOrganization(sourceAppId, targetOrganizationId)
                );

        StepVerifier.create(resultMono)
                .assertNext(application -> {
                    assertThat(application).isNotNull();
                    assertThat(application.getName()).isEqualTo("1 - public app");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void test2_forkApplicationWithReadApplicationUserAccess() {

        Organization targetOrganization = new Organization();
        targetOrganization.setName("test-user-organization");

        final Mono<Application> resultMono = organizationService.create(targetOrganization)
                .flatMap(organization -> {
                    testUserOrgId = organization.getId();
                    return applicationForkingService.forkApplicationToOrganization(sourceAppId, organization.getId());
                });

        StepVerifier.create(resultMono)
                .assertNext(application -> {
                    assertThat(application).isNotNull();
                    assertThat(application.getName()).isEqualTo("1 - public app");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test3_failForkApplicationWithInvalidPermission() {

        final Mono<Application> resultMono = applicationForkingService.forkApplicationToOrganization(sourceAppId, testUserOrgId);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(FieldName.ORGANIZATION, testUserOrgId)))
                .verify();
    }

    private Flux<ActionDTO> getActionsInOrganization(Organization organization) {
        return applicationService
                .findByOrganizationId(organization.getId(), READ_APPLICATIONS)
                // fetch the unpublished pages
                .flatMap(application -> newPageService.findByApplicationId(application.getId(), READ_PAGES, false))
                .flatMap(page -> newActionService.getUnpublishedActions(new LinkedMultiValueMap<>(
                        Map.of(FieldName.PAGE_ID, Collections.singletonList(page.getId())))));
    }
}
