package com.appsmith.server.solutions;

import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class ExampleApplicationsAreMarked {

    @Autowired
    UserService userService;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private SessionUserService sessionUserService;

    @MockBean
    private ConfigService configService;

    @MockBean
    private InstanceConfig instanceConfig;

    @Test
    @WithUserDetails(value = "api_user")
    public void exampleApplicationsAreMarked() {
        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization 3");
        final Mono<List<Application>> resultMono = Mono
                .zip(
                        organizationService.create(newOrganization),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Organization organization = tuple.getT1();

                    assert organization.getId() != null;
                    Mockito.when(configService.getTemplateOrganizationId()).thenReturn(Mono.just(organization.getId()));
                    Mockito.doNothing().when(instanceConfig).onApplicationEvent(
                            Mockito.any(ApplicationReadyEvent.class)
                    );
                    // Create 4 applications inside the example organization but only mark three applications as example
                    final Application app1 = new Application();
                    app1.setName("first application");
                    app1.setOrganizationId(organization.getId());
                    app1.setIsPublic(true);

                    final Application app2 = new Application();
                    app2.setName("second application");
                    app2.setOrganizationId(organization.getId());
                    app2.setIsPublic(true);

                    final Application app3 = new Application();
                    app3.setName("third application");
                    app3.setOrganizationId(organization.getId());
                    app3.setIsPublic(false);

                    final Application app4 = new Application();
                    app4.setName("fourth application");
                    app4.setOrganizationId(organization.getId());
                    app4.setIsPublic(false);

                    Mockito.when(configService.getTemplateApplications()).thenReturn(Flux.fromIterable(List.of(app1, app2, app3)));

                    return Mono
                            .when(
                                    applicationPageService.createApplication(app1),
                                    applicationPageService.createApplication(app2),
                                    applicationPageService.createApplication(app3),
                                    applicationPageService.createApplication(app4)
                            )
                            .thenReturn(organization.getId());
                })
                .flatMapMany(organizationId -> applicationService.findByOrganizationId(organizationId, READ_APPLICATIONS))
                .collectList();

        StepVerifier.create(resultMono)
                .assertNext(applications -> {
                    assertThat(applications).hasSize(4);
                    assertThat(applications.stream().filter(Application::isAppIsExample)).hasSize(3);
                })
                .verifyComplete();
    }

}
