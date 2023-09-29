package com.appsmith.server.packages.services.crud;

import com.appsmith.external.models.PackageDTO;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PackageDetailsDTO;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class CrudPackageServiceTest {

    @Autowired
    CrudPackageService crudPackageService;

    @SpyBean
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @MockBean
    FeatureFlagService featureFlagService;

    @SpyBean
    CommonConfig commonConfig;

    String workspaceId;
    String defaultEnvironmentId;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {

        User currentUser = sessionUserService.getCurrentUser().block();
        if (!currentUser.getEmail().equals("api_user")) {
            // Don't do any setups
            return;
        }

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(TRUE));

        doReturn(FALSE).when(commonConfig).isCloudHosting();

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_query_module_enabled)))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        User apiUser = userService.findByEmail("api_user").block();

        Workspace toCreate = new Workspace();
        toCreate.setName("ApplicationServiceTest");

        if (workspaceId == null) {
            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();

            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }
    }

    @WithUserDetails(value = "api_user")
    public void testCreateAndReadPackageWithValidInput() {
        final Package firstPackage = new Package();
        firstPackage.setName("Package X");
        firstPackage.setColor("#C2DAF0");
        firstPackage.setIcon("rupee");

        final Package secondPackage = new Package();
        secondPackage.setName("Package Y");
        secondPackage.setIcon("rupee");

        // create package test
        Mono<Package> firstPackageMono = crudPackageService.createPackage(firstPackage, workspaceId);

        StepVerifier.create(firstPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    assertThat(createdPackage.getName()).isEqualTo(firstPackage.getName());
                })
                .verifyComplete();

        Mono<Package> secondPackageMono = crudPackageService.createPackage(secondPackage, workspaceId);

        StepVerifier.create(secondPackageMono)
                .assertNext(createdPackage -> {
                    assertThat(createdPackage.getId()).isNotEmpty();
                    assertThat(createdPackage.getName()).isEqualTo(secondPackage.getName());
                })
                .verifyComplete();

        // get all packages in workspace home test
        Mono<List<PackageDTO>> allPackagesMono = crudPackageService.getAllPackages();

        AtomicReference<String> packageId = new AtomicReference<>();
        StepVerifier.create(allPackagesMono)
                .assertNext(allPackages -> {
                    assertThat(allPackages).isNotNull();
                    assertThat(allPackages).size().isEqualTo(2);
                    packageId.set(allPackages.get(0).getId());
                })
                .verifyComplete();

        // get package details by `packageId` test
        Mono<PackageDetailsDTO> packageDetailsDTOMono = crudPackageService.getPackageDetails(packageId.get());

        StepVerifier.create(packageDetailsDTOMono)
                .assertNext(packageDetailsDTO -> {
                    assertThat(packageDetailsDTO).isNotNull();
                    assertThat(packageDetailsDTO.getModules()).size().isEqualTo(0);
                })
                .verifyComplete();
    }

    @WithUserDetails(value = "api_user")
    public void shouldNotCreatePackageWhenPackageNameIsNotProvided() {
        final Package appsmithPackage = new Package();
        appsmithPackage.setColor("#C2DAF0");
        appsmithPackage.setIcon("rupee");

        Mono<Package> packageMono = crudPackageService.createPackage(appsmithPackage, workspaceId);

        StepVerifier.create(packageMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals("Please enter a valid parameter name."))
                .verify();
    }
}
