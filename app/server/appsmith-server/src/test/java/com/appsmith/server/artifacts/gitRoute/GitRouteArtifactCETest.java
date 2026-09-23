package com.appsmith.server.artifacts.gitRoute;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.GitArtifactHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Authorization coverage for {@link GitRouteArtifactCE#getArtifact}.
 *
 * <p>The git-route AOP layer resolves the target application through this method before the
 * downstream, ACL-checked business logic runs. It must resolve via the ACL-aware
 * {@link GitArtifactHelper#getArtifactById(String, AclPermission)} with read permission and fail
 * closed for a caller with no access to the target application — never via the raw, unfiltered
 * {@link ApplicationRepository#findById(String)} soft-delete lookup, which would let the aspect go
 * on to decrypt and use the target application's stored Git deploy-key credential.
 */
@ExtendWith(MockitoExtension.class)
class GitRouteArtifactCETest {

    private static final String APP_ID = "victim-app-id";

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private GitArtifactHelperResolver gitArtifactHelperResolver;

    @SuppressWarnings("rawtypes")
    @Mock
    private GitArtifactHelper gitArtifactHelper;

    private GitRouteArtifact gitRouteArtifact;

    @BeforeEach
    void setUp() {
        gitRouteArtifact = new GitRouteArtifact(applicationRepository, gitArtifactHelperResolver);
    }

    @Test
    @DisplayName("getArtifact(APPLICATION): resolves via the ACL-checked helper with read permission, "
            + "never the raw repository")
    @SuppressWarnings("unchecked")
    void getArtifact_application_resolvesViaAclCheckedHelper() {
        Application app = new Application();
        app.setId(APP_ID);

        lenient()
                .when(gitArtifactHelperResolver.getArtifactHelper(ArtifactType.APPLICATION))
                .thenReturn(gitArtifactHelper);
        lenient().when(gitArtifactHelper.getArtifactReadPermission()).thenReturn(AclPermission.READ_APPLICATIONS);
        lenient()
                .doReturn(Mono.just(app))
                .when(gitArtifactHelper)
                .getArtifactById(APP_ID, AclPermission.READ_APPLICATIONS);
        // The raw, unchecked lookup would also succeed — the point is it must NOT be used.
        lenient().when(applicationRepository.findById(APP_ID)).thenReturn(Mono.just(app));

        StepVerifier.create(gitRouteArtifact.getArtifact(ArtifactType.APPLICATION, APP_ID))
                .assertNext(
                        resolved -> assertThat(((Artifact) resolved).getId()).isEqualTo(APP_ID))
                .verifyComplete();

        verify(gitArtifactHelper).getArtifactById(APP_ID, AclPermission.READ_APPLICATIONS);
        verify(applicationRepository, never()).findById(anyString());
    }

    @Test
    @DisplayName("getArtifact(APPLICATION): fails closed when the caller lacks read access, "
            + "even though the raw repository lookup would have returned the application")
    @SuppressWarnings("unchecked")
    void getArtifact_application_deniedWithoutReadPermission_doesNotLeakViaRawRepository() {
        Application victimApp = new Application();
        victimApp.setId(APP_ID);

        lenient()
                .when(gitArtifactHelperResolver.getArtifactHelper(ArtifactType.APPLICATION))
                .thenReturn(gitArtifactHelper);
        lenient().when(gitArtifactHelper.getArtifactReadPermission()).thenReturn(AclPermission.READ_APPLICATIONS);
        // ACL-checked resolution denies the unrelated caller.
        lenient()
                .doReturn(Mono.empty())
                .when(gitArtifactHelper)
                .getArtifactById(APP_ID, AclPermission.READ_APPLICATIONS);
        // Raw, unfiltered lookup WOULD hand back the victim's application — this is the leak the fix closes.
        lenient().when(applicationRepository.findById(APP_ID)).thenReturn(Mono.just(victimApp));

        StepVerifier.create(gitRouteArtifact.getArtifact(ArtifactType.APPLICATION, APP_ID))
                .verifyError(AppsmithException.class);

        verify(applicationRepository, never()).findById(anyString());
    }
}
