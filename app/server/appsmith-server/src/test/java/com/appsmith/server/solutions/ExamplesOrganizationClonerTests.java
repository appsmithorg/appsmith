package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple3;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class ExamplesOrganizationClonerTests {

    @Autowired
    UserService userService;

    @Autowired
    private ExamplesOrganizationCloner examplesOrganizationCloner;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private ConfigRepository configRepository;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private DatasourceService datasourceService;

    @Test
    @WithUserDetails(value = "api_user")
    public void createNewUserValid() {
        final Mono<Organization> organizationMono = organizationRepository
                .findByName("Spring Test Organization", AclPermission.READ_ORGANIZATIONS)
                .flatMap(organization -> {
                    if (organization.getId() == null) {
                        log.error("Cannot find Spring Test Organization");
                    }
                    Config config = new Config();
                    config.setName(ExamplesOrganizationCloner.TEMPLATE_ORGANIZATION_CONFIG_NAME);
                    config.setConfig(new JSONObject(Map.of(FieldName.ORGANIZATION_ID, organization.getId())));
                    return configRepository.save(config).thenReturn(organization);
                })
                .flatMap(organization -> examplesOrganizationCloner.cloneExamplesOrganization())
                .cache();

        final Mono<Tuple3<Organization, List<Application>, List<Datasource>>> resultMono = Mono.zip(
                organizationMono,
                organizationMono
                        .flatMap(organization -> applicationService.findByOrganizationId(organization.getId()).collectList()),
                organizationMono
                        .flatMap(organization -> datasourceService.findAllByOrganizationId(organization.getId()).collectList())
        );

        StepVerifier.create(resultMono)
                .assertNext(tuple -> {
                    Organization organization = tuple.getT1();
                    assertThat(organization).isNotNull();
                    assertThat(organization.getId()).isNotNull();
                    assertThat(organization.getName()).isEqualTo("api_user's Examples");
                    assertThat(organization.getPolicies()).isNotEmpty();

                    final List<Application> applications = tuple.getT2();
                    assertThat(applications).hasSize(3);
                    assertThat(applications.stream().map(Application::getName).collect(Collectors.toSet()))
                            .containsExactlyInAnyOrder(
                                    "LayoutServiceTest TestApplications",
                                    "TestApplications",
                                    "Another TestApplications"
                            );

                    final List<Datasource> datasources = tuple.getT3();
                    assertThat(datasources).isEmpty();
                })
                .verifyComplete();
    }
}
