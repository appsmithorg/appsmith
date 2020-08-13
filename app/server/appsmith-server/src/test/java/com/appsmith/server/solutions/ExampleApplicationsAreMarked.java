package com.appsmith.server.solutions;

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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
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

                    Mockito.when(configService.getTemplateOrganizationId()).thenReturn(Mono.just(organization.getId()));

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

                    return Mono
                            .when(
                                    applicationPageService.createApplication(app1),
                                    applicationPageService.createApplication(app2),
                                    applicationPageService.createApplication(app3)
                            )
                            .thenReturn(organization.getId());
                })
                .flatMapMany(organizationId -> applicationService.findByOrganizationId(organizationId, READ_APPLICATIONS))
                .collectList();

        StepVerifier.create(resultMono)
                .assertNext(applications -> {
                    assertThat(applications).hasSize(3);
                    assertThat(applications.stream().allMatch(Application::isAppIsExample)).isTrue();
                })
                .verifyComplete();
    }

}
