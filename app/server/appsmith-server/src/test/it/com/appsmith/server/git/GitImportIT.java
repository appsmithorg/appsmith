package com.appsmith.server.git;

import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitStatusDTO;
import com.appsmith.server.git.ArtifactBuilderExtension;
import com.appsmith.server.git.GitServerInitializerExtension;
import com.appsmith.server.git.common.CommonGitService;
import com.appsmith.server.git.templates.contexts.GitContext;
import com.appsmith.server.git.templates.contexts.GitImportContext;
import com.appsmith.server.git.templates.providers.GitImportTestTemplateProvider;
import static com.appsmith.server.constants.ArtifactType.APPLICATION;
import com.appsmith.server.git.GitTestUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.Status;
import org.eclipse.jgit.revwalk.RevCommit;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Iterator;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class GitImportIT {

    @Autowired
    private CommonGitService commonGitService;

    @Autowired
    private ProjectProperties projectProperties;

    @Autowired
    private GitTestUtils gitTestUtils;

    @Autowired
    @RegisterExtension
    GitImportTestTemplateProvider importTestTemplateProvider;

    @Autowired
    @RegisterExtension
    ArtifactBuilderExtension artifactBuilderExtension;

    @Autowired
    @RegisterExtension
    GitServerInitializerExtension gitServerInitializerExtension;

    private static final String ORIGIN = "origin";
    private static final String TEST_BRANCH = "test-branch";

    @TestTemplate
    void testBasicImportScenario(GitImportContext context, ExtensionContext extensionContext) {
        // Create and configure the artifact
        Artifact artifact = artifactBuilderExtension.buildArtifact(context, extensionContext).block();
        String artifactId = artifact.getId();
        assertThat(artifact).isNotNull();
        assertThat(artifactId).isNotNull();

        // Set up Git connection
        GitConnectDTO connectDTO = new GitConnectDTO();
        connectDTO.setRemoteUrl(gitServerInitializerExtension.getGitSshUrl("test" + artifactId));
        connectDTO.setGitProfile(new GitProfile());
        connectDTO.setIsRepoPrivate(false);

        // Connect to Git repository
        Artifact connectedArtifact = commonGitService.connectArtifactToGit(artifactId, connectDTO, ORIGIN, context.getArtifactType()).block();
        assertThat(connectedArtifact).isNotNull();
        assertThat(connectedArtifact.getGitArtifactMetadata()).isNotNull();

        // Verify Git status after import
        GitStatusDTO statusDTO = commonGitService.getStatus(connectedArtifact.getId(), true, context.getArtifactType()).block();
        assertThat(statusDTO).isNotNull();
        assertThat(statusDTO.getIsClean()).isTrue();

        // Make a change to verify Git operations work
        gitTestUtils.createADiffInArtifact(connectedArtifact).block();
        
        // Check status reflects changes
        GitStatusDTO modifiedStatus = commonGitService.getStatus(connectedArtifact.getId(), true, context.getArtifactType()).block();
        assertThat(modifiedStatus).isNotNull();
        assertThat(modifiedStatus.getIsClean()).isFalse();

        // Test discard changes
        Artifact discardedArtifact = commonGitService.discardChanges(connectedArtifact.getId(), context.getArtifactType()).block();
        assertThat(discardedArtifact).isNotNull();

        // Verify status is clean after discard
        GitStatusDTO finalStatus = commonGitService.getStatus(connectedArtifact.getId(), true, context.getArtifactType()).block();
        assertThat(finalStatus).isNotNull();
        assertThat(finalStatus.getIsClean()).isTrue();
    }

    @TestTemplate
    void testPartialImportWithUnconfiguredDatasources(GitImportContext context, ExtensionContext extensionContext) {
        // Create and configure the artifact with unconfigured datasources
        Artifact artifact = artifactBuilderExtension.buildArtifactWithUnconfiguredDatasource(context, extensionContext).block();
        String artifactId = artifact.getId();
        assertThat(artifact).isNotNull();
        assertThat(artifactId).isNotNull();

        // Set up Git connection
        GitConnectDTO connectDTO = new GitConnectDTO();
        connectDTO.setRemoteUrl(gitServerInitializerExtension.getGitSshUrl("test" + artifactId));
        connectDTO.setGitProfile(new GitProfile());
        connectDTO.setIsRepoPrivate(false);

        // Connect to Git repository
        Artifact connectedArtifact = commonGitService.connectArtifactToGit(artifactId, connectDTO, ORIGIN, context.getArtifactType()).block();
        assertThat(connectedArtifact).isNotNull();
        assertThat(connectedArtifact.getGitArtifactMetadata()).isNotNull();

        // Create and checkout a new branch
        commonGitService.createAndCheckoutBranch(connectedArtifact.getId(), TEST_BRANCH, context.getArtifactType()).block();

        // Make changes in the new branch
        gitTestUtils.createADiffInArtifact(connectedArtifact).block();

        // Commit changes
        commonGitService.commitArtifact(connectedArtifact.getId(), "test: add changes in new branch", context.getArtifactType()).block();

        // Switch back to default branch
        commonGitService.checkoutBranch(connectedArtifact.getId(), "master", context.getArtifactType()).block();

        // Merge changes from test branch
        commonGitService.mergeBranch(connectedArtifact.getId(), TEST_BRANCH, context.getArtifactType()).block();

        // Verify merge was successful
        GitStatusDTO statusDTO = commonGitService.getStatus(connectedArtifact.getId(), true, context.getArtifactType()).block();
        assertThat(statusDTO).isNotNull();
        assertThat(statusDTO.getIsClean()).isTrue();

        // Verify unconfigured datasources are preserved
        assertThat(connectedArtifact.getDatasources()).isNotEmpty();
        connectedArtifact.getDatasources().forEach(datasource -> 
            assertThat(datasource.getDatasourceConfiguration()).isNull()
        );
    }
}
