package com.appsmith.server.configurations;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationPlugin;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.dtos.OrganizationPluginStatus;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_ORGANIZATIONS;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@Configuration
public class SeedMongoData {

    @Bean
    ApplicationRunner init(UserRepository userRepository,
                           OrganizationRepository organizationRepository,
                           ApplicationRepository applicationRepository,
                           PageRepository pageRepository,
                           PluginRepository pluginRepository,
                           ReactiveMongoTemplate mongoTemplate) {

        log.info("Seeding the data");
        final String API_USER_EMAIL = "api_user";
        final String TEST_USER_EMAIL = "usertest@usertest.com";
        final String ADMIN_USER_EMAIL = "admin@solutiontest.com";
        final String DEV_USER_EMAIL = "developer@solutiontest.com";

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy manageOrgAppPolicy = Policy.builder().permission(ORGANIZATION_MANAGE_APPLICATIONS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy userManageOrgPolicy = Policy.builder().permission(USER_MANAGE_ORGANIZATIONS.getValue())
                .users(Set.of(API_USER_EMAIL, TEST_USER_EMAIL, ADMIN_USER_EMAIL, DEV_USER_EMAIL))
                .build();

        Policy inviteUserOrgPolicy = Policy.builder().permission(ORGANIZATION_INVITE_USERS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy readOrgPolicy = Policy.builder().permission(READ_ORGANIZATIONS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy manageOrgPolicy = Policy.builder().permission(MANAGE_ORGANIZATIONS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy readApiUserPolicy = Policy.builder().permission(READ_USERS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy manageApiUserPolicy = Policy.builder().permission(MANAGE_USERS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy readTestUserPolicy = Policy.builder().permission(READ_USERS.getValue())
                .users(Set.of(TEST_USER_EMAIL))
                .build();

        Policy readAdminUserPolicy = Policy.builder().permission(READ_USERS.getValue())
                .users(Set.of(ADMIN_USER_EMAIL))
                .build();

        Policy readDevUserPolicy = Policy.builder().permission(READ_USERS.getValue())
                .users(Set.of(DEV_USER_EMAIL))
                .build();

        Object[][] userData = {
                {"user test", TEST_USER_EMAIL, UserState.ACTIVATED, Set.of(readTestUserPolicy, userManageOrgPolicy)},
                {"api_user", API_USER_EMAIL, UserState.ACTIVATED, Set.of(userManageOrgPolicy, readApiUserPolicy, manageApiUserPolicy)},
                {"admin test", ADMIN_USER_EMAIL, UserState.ACTIVATED, Set.of(readAdminUserPolicy, userManageOrgPolicy)},
                {"developer test", DEV_USER_EMAIL, UserState.ACTIVATED, Set.of(readDevUserPolicy, userManageOrgPolicy)},
        };
        Object[][] orgData = {
                {"Spring Test Organization", "appsmith-spring-test.com", "appsmith.com", "spring-test-organization",
                        Set.of(manageOrgAppPolicy, manageOrgPolicy, readOrgPolicy, inviteUserOrgPolicy)},
                {"Another Test Organization", "appsmith-another-test.com", "appsmith.com", "another-test-organization",
                        Set.of(manageOrgAppPolicy, manageOrgPolicy, readOrgPolicy, inviteUserOrgPolicy)}
        };

        Object[][] appData = {
                {"LayoutServiceTest TestApplications", Set.of(manageAppPolicy, readAppPolicy)},
                {"TestApplications", Set.of(manageAppPolicy, readAppPolicy)},
                {"Another TestApplications", Set.of(manageAppPolicy, readAppPolicy)}
        };
        Object[][] pageData = {
                {"validPageName", Set.of(managePagePolicy, readPagePolicy)}
        };
        Object[][] pluginData = {
                {"Installed Plugin Name", PluginType.API, "installed-plugin"},
                {"Installed DB Plugin Name", PluginType.DB, "installed-db-plugin"},
                {"Installed JS Plugin Name", PluginType.JS, "installed-js-plugin"},
                {"Not Installed Plugin Name", PluginType.API, "not-installed-plugin"}
        };

        // Seed the plugin data into the DB
        Flux<Plugin> pluginFlux = Flux.just(pluginData)
                .map(array -> {
                    log.debug("Creating the plugins");
                    Plugin plugin = new Plugin();
                    plugin.setName((String) array[0]);
                    plugin.setType((PluginType) array[1]);
                    plugin.setPackageName((String) array[2]);
                    log.debug("Create plugin: {}", plugin);
                    return plugin;
                }).flatMap(pluginRepository::save)
                .cache();

        Flux<User> userFlux = Flux.just(userData)
                .map(array -> {
                    log.debug("Going to create bare users");
                    User user = new User();
                    user.setName((String) array[0]);
                    user.setEmail((String) array[1]);
                    user.setState((UserState) array[2]);
                    user.setPolicies((Set<Policy>) array[3]);
                    log.debug("Bare user: {}", user);
                    return user;
                })
                .flatMap(userRepository::save)
                .cache();

        // Seed the organization data into the DB
        Flux<Organization> organizationFlux = mongoTemplate
                .find(new Query().addCriteria(where("name").in(pluginData[0][0], pluginData[1][0], pluginData[2][0])), Plugin.class)
                .map(plugin -> new OrganizationPlugin(plugin.getId(), OrganizationPluginStatus.FREE))
                .collect(Collectors.toSet())
                .cache()
                .repeat()
                .zipWithIterable(List.of(orgData))
                .map(tuple -> {
                    final Set<OrganizationPlugin> orgPlugins = tuple.getT1();
                    final Object[] orgArray = tuple.getT2();

                    Organization organization = new Organization();
                    organization.setName((String) orgArray[0]);
                    organization.setDomain((String) orgArray[1]);
                    organization.setWebsite((String) orgArray[2]);
                    organization.setSlug((String) orgArray[3]);
                    organization.setPolicies((Set<Policy>) orgArray[4]);
                    organization.setPlugins(orgPlugins);

                    List<UserRole> userRoles = new ArrayList<>();
                    UserRole userRole = new UserRole();
                    String roleName = "Administrator";
                    userRole.setRole(AppsmithRole.generateAppsmithRoleFromName(roleName));
                    userRole.setUsername(API_USER_EMAIL);
                    userRole.setRoleName(roleName);
                    userRoles.add(userRole);
                    organization.setUserRoles(userRoles);

                    log.debug("In the orgFlux. Create Organization: {}", organization);
                    return organization;
                })
                .flatMap(organizationRepository::save);

        Flux<Organization> organizationFlux1 = organizationRepository.deleteAll()
                .thenMany(pluginFlux)
                .thenMany(userFlux)
                .thenMany(organizationFlux);

        Flux<User> addUserOrgFlux = organizationFlux1
                .flatMap(organization -> userFlux
                        .flatMap(user -> {
                            log.debug("**** In the addUserOrgFlux");
                            log.debug("User: {}", user);
                            log.debug("Org: {}", organization);
                            user.setCurrentOrganizationId(organization.getId());
                            Set<String> organizationIds = user.getOrganizationIds();
                            if (organizationIds == null) {
                                organizationIds = new HashSet<>();
                            }
                            organizationIds.add(organization.getId());
                            user.setOrganizationIds(organizationIds);
                            log.debug("AddUserOrg User: {}, Org: {}", user, organization);
                            return userRepository.save(user)
                                    .map(u -> {
                                        log.debug("Saved the org to user. User: {}", u);
                                        return u;
                                    });
                        }));

        Query orgNameQuery = new Query(where("slug").is(orgData[0][3]));
        Mono<Organization> orgByNameMono = mongoTemplate.findOne(orgNameQuery, Organization.class)
                .switchIfEmpty(Mono.error(new Exception("Can't find org")));

        Query appNameQuery = new Query(where("name").is(appData[0][0]));
        Mono<Application> appByNameMono = mongoTemplate.findOne(appNameQuery, Application.class)
                .switchIfEmpty(Mono.error(new Exception("Can't find app")));
        return args -> {
            organizationFlux1
                    .thenMany(addUserOrgFlux)
                    // Query the seed data to get the organizationId (required for application creation)
                    .then(orgByNameMono)
                    .map(org -> org.getId())
                    // Seed the user data into the DB
                    .flatMapMany(orgId ->
                                    // Seed the application data into the DB
                                    Flux.just(appData)
                                            .map(array -> {
                                                Application app = new Application();
                                                app.setName((String) array[0]);
                                                app.setOrganizationId(orgId);
                                                app.setPolicies((Set<Policy>) array[1]);
                                                return app;
                                            })
                                            .flatMap(applicationRepository::save)
                            // Query the seed data to get the applicationId (required for page creation)
                    ).then(appByNameMono)
                    .map(application -> application.getId())
                    .flatMapMany(appId -> Flux.just(pageData)
                            // Seed the page data into the DB
                            .map(array -> {
                                Page page = new Page();
                                page.setName((String) array[0]);
                                page.setApplicationId(appId);
                                page.setPolicies((Set<Policy>) array[1]);
                                return page;
                            })
                            .flatMap(pageRepository::save)
                    )
                    .blockLast();
        };
    }
}
