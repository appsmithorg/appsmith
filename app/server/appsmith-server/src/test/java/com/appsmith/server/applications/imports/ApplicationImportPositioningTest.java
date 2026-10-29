package com.appsmith.server.applications.imports;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationDetail;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.helpers.ImportArtifactPermissionProvider;
import com.appsmith.server.staticurl.StaticUrlService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApplicationImportPositioningTest {
    @Mock
    ApplicationService applicationService;

    @Mock
    StaticUrlService staticUrlService;

    @Mock
    ImportArtifactPermissionProvider permissions;

    @InjectMocks
    ApplicationImportServiceCEImpl service;

    private static ApplicationDetail detail(String type) {
        ApplicationDetail detail = new ApplicationDetail();
        detail.setAppPositioning(new Application.AppPositioning(type));
        return detail;
    }

    private Mono<Application> importOverExisting(Application incoming, Application target) {
        target.setId("target-app");
        when(permissions.getRequiredPermissionOnTargetApplication()).thenReturn(AclPermission.MANAGE_APPLICATIONS);
        when(applicationService.findById("target-app", AclPermission.MANAGE_APPLICATIONS))
                .thenReturn(Mono.just(target));
        when(staticUrlService.generateAndUpdateApplicationSlugForImportsOnExistingApps(eq(incoming), eq(target)))
                .thenReturn(Mono.just(incoming));
        when(applicationService.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));
        ImportingMetaDTO meta = ImportingMetaDTO.builder()
                .artifactId("target-app")
                .workspaceId("workspace")
                .appendToArtifact(false)
                .permissionProvider(permissions)
                .build();
        MappedImportableResourcesDTO resources = new MappedImportableResourcesDTO();
        resources.setInstalledJsLibsList(List.of());
        User user = new User();
        user.setEmail("owner@appsmith.test");
        return service.updateAndSaveArtifactInContext(incoming, meta, resources, Mono.just(user));
    }

    @ParameterizedTest
    @MethodSource("downgradeCases")
    void should_preserveAnvilStamp_when_importReplacesExistingDetail(boolean publishedOnly, String incomingType) {
        // Given
        Application target = new Application();
        target.setUnpublishedApplicationDetail(detail(publishedOnly ? "FIXED" : "ANVIL"));
        target.setPublishedApplicationDetail(detail(publishedOnly ? "ANVIL" : "FIXED"));
        Application incoming = new Application();
        incoming.setName("Imported app");
        incoming.setUnpublishedApplicationDetail(incomingType == null ? null : detail(incomingType));

        // When
        Mono<Application> result = importOverExisting(incoming, target);

        // Then
        StepVerifier.create(result)
                .assertNext(saved -> {
                    assertThat(saved.getUnpublishedApplicationDetail()
                                    .getAppPositioning()
                                    .getType()
                                    .name())
                            .isEqualTo("ANVIL");
                    assertThat(saved.getName()).isEqualTo("Imported app");
                })
                .verifyComplete();
        verify(applicationService).save(target);
    }

    static Stream<Arguments> downgradeCases() {
        return Stream.of(false, true).flatMap(published -> Stream.of("FIXED", "AUTO", null)
                .map(incoming -> Arguments.of(published, incoming)));
    }

    @Test
    void should_keepImportedLayout_when_targetIsNotAnvil() {
        // Given
        Application target = new Application();
        target.setUnpublishedApplicationDetail(detail("FIXED"));
        Application incoming = new Application();
        incoming.setUnpublishedApplicationDetail(detail("AUTO"));

        // When
        Mono<Application> result = importOverExisting(incoming, target);

        // Then
        StepVerifier.create(result)
                .assertNext(saved -> assertThat(saved.getUnpublishedApplicationDetail()
                                .getAppPositioning()
                                .getType()
                                .name())
                        .isEqualTo("AUTO"))
                .verifyComplete();
    }
}
