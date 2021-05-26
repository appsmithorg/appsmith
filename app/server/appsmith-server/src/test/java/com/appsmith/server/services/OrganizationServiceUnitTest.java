package com.appsmith.server.services;

import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.test.StepVerifier;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;

import static com.appsmith.server.acl.AclPermission.ORGANIZATION_INVITE_USERS;

@RunWith(SpringJUnit4ClassRunner.class)
public class OrganizationServiceUnitTest {

    @MockBean PluginRepository pluginRepository;
    @MockBean SessionUserService sessionUserService;
    @MockBean UserOrganizationService userOrganizationService;
    @MockBean UserRepository userRepository;
    @MockBean RoleGraph roleGraph;
    @MockBean AssetRepository assetRepository;
    @MockBean AssetService assetService;
    @MockBean Scheduler scheduler;
    @MockBean MongoConverter mongoConverter;
    @MockBean ReactiveMongoTemplate reactiveMongoTemplate;
    @MockBean OrganizationRepository organizationRepository;
    @MockBean Validator validator;
    @MockBean AnalyticsService analyticsService;

    OrganizationService organizationService;

    @Before
    public void setUp() {
        organizationService = new OrganizationServiceImpl(scheduler, validator, mongoConverter, reactiveMongoTemplate,
                organizationRepository, analyticsService, pluginRepository, sessionUserService, userOrganizationService,
                userRepository, roleGraph, assetRepository, assetService
        );
        MockitoAnnotations.initMocks(this);
    }

    @Test
    public void getOrganizationMembers_WhenNameNotInRoleButInUser_NameFetchedFromUser() {
        // create a organization object
        Organization testOrg = new Organization();
        testOrg.setName("Get All Members For Organization Test");
        testOrg.setDomain("test.com");
        testOrg.setWebsite("https://test.com");
        testOrg.setId("test-org-id");

        // add a role to the test org object
        List<UserRole> userRoleList = new ArrayList<>();
        UserRole userRole = new UserRole();
        userRole.setUserId("test-user-id");
        userRole.setName("Initial Name");
        userRoleList.add(userRole);
        testOrg.setUserRoles(userRoleList);

        // create the user which acts as updated user object
        User user = new User();
        user.setId("test-user-id");
        user.setName("Updated name");

        // mock repository methods so that they return the objects we've created
        Mockito.when(organizationRepository.findById("test-org-id", ORGANIZATION_INVITE_USERS))
                .thenReturn(Mono.just(testOrg));
        Mockito.when(userRepository.findAllById(List.of("test-user-id")))
                .thenReturn(Flux.just(user));

        Mono<List<UserRole>> organizationMembers = organizationService.getOrganizationMembers(testOrg.getId());
        StepVerifier
                .create(organizationMembers)
                .assertNext(userRoles -> {
                    Assert.assertNotNull(userRoles);
                    UserRole userRole1 = userRoles.get(0);
                    Assert.assertEquals("Updated name", userRole1.getName());
                })
                .verifyComplete();
    }
}
