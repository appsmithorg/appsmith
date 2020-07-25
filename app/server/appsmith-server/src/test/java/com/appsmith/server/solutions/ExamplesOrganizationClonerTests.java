package com.appsmith.server.solutions;

import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;

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
    private ConfigRepository configRepository;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private ApplicationPageService applicationPageService;

    /*
    @Test
    @WithUserDetails(value = "api_user")
    public void cloneOrganizationWithItsContents() {

        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization");
        final Mono<Organization> organizationMono = organizationService.create(newOrganization)
            .flatMap(organization -> {
                if (organization.getId() == null) {
                    return Mono.error(new RuntimeException("Created templates organization doesn't have an ID."));
                }

                Application app1 = new Application();
                app1.setName("1 - public app");
                app1.setOrganizationId(organization.getId());
                app1.setIsPublic(true);

                Application app2 = new Application();
                app2.setOrganizationId(organization.getId());
                app2.setName("2 - private app");

                Config config = new Config();
                config.setName(ExamplesOrganizationCloner.TEMPLATE_ORGANIZATION_CONFIG_NAME);
                config.setConfig(new JSONObject(Map.of(FieldName.ORGANIZATION_ID, organization.getId())));

                return Mono.when(
                        applicationPageService.createApplication(app1),
                        applicationPageService.createApplication(app2),
                        configRepository.save(config).thenReturn(organization)
                ).thenReturn(organization);
            })
            .flatMap(organization -> examplesOrganizationCloner.cloneExamplesOrganization())
            .cache();

        final Mono<Tuple3<Organization, List<Application>, List<Datasource>>> resultMono = Mono.zip(
                organizationMono,
                organizationMono
                        .flatMap(organization -> applicationService.findByOrganizationId(organization.getId(), READ_APPLICATIONS).collectList()),
                organizationMono
                        .flatMap(organization -> datasourceService.findAllByOrganizationId(organization.getId(), READ_DATASOURCES).collectList())
        );

        StepVerifier.create(resultMono)
                .assertNext(tuple -> {
                    Organization organization = tuple.getT1();
                    assertThat(organization).isNotNull();
                    assertThat(organization.getId()).isNotNull();
                    assertThat(organization.getName()).isEqualTo("api_user's Examples");
                    assertThat(organization.getPolicies()).isNotEmpty();

                    final List<Application> applications = tuple.getT2();
                    assertThat(applications).hasSize(1);
                    assertThat(applications.stream().map(Application::getName).collect(Collectors.toSet()))
                            .containsExactlyInAnyOrder(
                                    "1 - public app"
                            );

                    assertThat(applications.get(0).getPages()).hasSize(1);

                    final List<Datasource> datasources = tuple.getT3();
                    assertThat(datasources).isEmpty();
                })
                .verifyComplete();
    }
     */
}
