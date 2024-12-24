package com.appsmith.server.git;

import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitStatusDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.GitBranchDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.server.git.ArtifactBuilderExtension;
import com.appsmith.server.git.GitServerInitializerExtension;
import java.util.List;
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
    private static final String FEATURE_BRANCH = "feature";

    @TestTemplate
    void testEmptyRepoImportScenario(GitImportContext context, ExtensionContext extensionContext) {
        // Create and configure the artifact to get workspace ID
        Artifact artifact = artifactBuilderExtension.buildArtifact(context, extensionContext).block();
        String workspaceId = artifact.getWorkspaceId();
        assertThat(artifact).isNotNull();
        assertThat(workspaceId).isNotNull();

        // Set up Git import
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(gitServerInitializerExtension.getGitSshUrl("test"));
        gitConnectDTO.setGitProfile(new GitProfile());
        gitConnectDTO.setIsRepoPrivate(false);

        // Import from Git repository
        ApplicationImportDTO importedArtifact = (ApplicationImportDTO) commonGitService
                .importArtifactFromGit(workspaceId, gitConnectDTO, context.getArtifactType())
                .block();
        assertThat(importedArtifact).isNotNull();
        assertThat(importedArtifact.getApplication()).isNotNull();
        assertThat(importedArtifact.getApplication().getGitApplicationMetadata()).isNotNull();

        // Verify Git status after import
        GitStatusDTO statusDTO = commonGitService.getStatus(
                importedArtifact.getApplication().getId(), 
                true, 
                context.getArtifactType()
        ).block();
        assertThat(statusDTO).isNotNull();
        assertThat(statusDTO.getIsClean()).isTrue();

        // Make a change to verify Git operations work
        gitTestUtils.createADiffInArtifact(importedArtifact.getApplication()).block();
        
        // Check status reflects changes
        GitStatusDTO modifiedStatus = commonGitService.getStatus(
                importedArtifact.getApplication().getId(), 
                true, 
                context.getArtifactType()
        ).block();
        assertThat(modifiedStatus).isNotNull();
        assertThat(modifiedStatus.getIsClean()).isFalse();

        // Test discard changes
        Artifact discardedArtifact = commonGitService.discardChanges(
                importedArtifact.getApplication().getId(), 
                context.getArtifactType()
        ).block();
        assertThat(discardedArtifact).isNotNull();

        // Verify status is clean after discard
        GitStatusDTO finalStatus = commonGitService.getStatus(
                importedArtifact.getApplication().getId(), 
                true, 
                context.getArtifactType()
        ).block();
        assertThat(finalStatus).isNotNull();
        assertThat(finalStatus.getIsClean()).isTrue();
    }

    @TestTemplate
    void testImportWithMultipleDatasources(GitImportContext context, ExtensionContext extensionContext) {
        // Create and configure the artifact to get workspace ID
        Artifact artifact = artifactBuilderExtension.buildArtifact(context, extensionContext).block();
        String workspaceId = artifact.getWorkspaceId();
        assertThat(artifact).isNotNull();
        assertThat(workspaceId).isNotNull();

        // Set up Git import with a repository containing multiple datasources
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(gitServerInitializerExtension.getGitSshUrl("test"));
        gitConnectDTO.setGitProfile(new GitProfile());
        gitConnectDTO.setIsRepoPrivate(false);

        // Import from Git repository
        ApplicationImportDTO importedArtifact = (ApplicationImportDTO) commonGitService
                .importArtifactFromGit(workspaceId, gitConnectDTO, context.getArtifactType())
                .block();
        assertThat(importedArtifact).isNotNull();
        assertThat(importedArtifact.getApplication()).isNotNull();
        assertThat(importedArtifact.getApplication().getGitApplicationMetadata()).isNotNull();

        // Verify multiple datasources were imported
        assertThat(importedArtifact.getUnConfiguredDatasourceList()).isNotEmpty();
        assertThat(importedArtifact.getDatasourceConfigurationList()).isNotEmpty();

        // Verify Git status after import
        GitStatusDTO statusDTO = commonGitService.getStatus(
                importedArtifact.getApplication().getId(),
                true,
                context.getArtifactType()
        ).block();
        assertThat(statusDTO).isNotNull();
        assertThat(statusDTO.getIsClean()).isTrue();

        // Make changes to datasource configurations
        gitTestUtils.createADiffInArtifact(importedArtifact.getApplication()).block();

        // Verify status shows changes
        GitStatusDTO modifiedStatus = commonGitService.getStatus(
                importedArtifact.getApplication().getId(),
                true,
                context.getArtifactType()
        ).block();
        assertThat(modifiedStatus).isNotNull();
        assertThat(modifiedStatus.getIsClean()).isFalse();

        // Discard changes and verify status is clean again
        Artifact discardedArtifact = commonGitService.discardChanges(
                importedArtifact.getApplication().getId(),
                context.getArtifactType()
        ).block();
        assertThat(discardedArtifact).isNotNull();

        GitStatusDTO finalStatus = commonGitService.getStatus(
                importedArtifact.getApplication().getId(),
                true,
                context.getArtifactType()
        ).block();
        assertThat(finalStatus).isNotNull();
        assertThat(finalStatus.getIsClean()).isTrue();
        // Create and configure the artifact with unconfigured datasources
        Artifact artifact = artifactBuilderExtension.buildArtifactWithUnconfiguredDatasource(context, extensionContext).block();
        String workspaceId = artifact.getWorkspaceId();
        assertThat(artifact).isNotNull();
        assertThat(workspaceId).isNotNull();

        // Set up Git import
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(gitServerInitializerExtension.getGitSshUrl("test"));
        gitConnectDTO.setGitProfile(new GitProfile());
        gitConnectDTO.setIsRepoPrivate(false);

        // Import from Git repository
        ApplicationImportDTO importedArtifact = (ApplicationImportDTO) commonGitService
                .importArtifactFromGit(workspaceId, gitConnectDTO, context.getArtifactType())
                .block();
        assertThat(importedArtifact).isNotNull();
        assertThat(importedArtifact.getApplication()).isNotNull();
        assertThat(importedArtifact.getApplication().getGitApplicationMetadata()).isNotNull();

        // Verify Git status after import
        GitStatusDTO statusDTO = commonGitService.getStatus(
                importedArtifact.getApplication().getId(), 
                true, 
                context.getArtifactType()
        ).block();
        assertThat(statusDTO).isNotNull();
        assertThat(statusDTO.getIsClean()).isTrue();

        // Verify unconfigured datasources are preserved
        assertThat(importedArtifact.getApplication().getDatasources()).isNotEmpty();
        importedArtifact.getApplication().getDatasources().forEach(datasource -> 
            assertThat(datasource.getDatasourceConfiguration()).isNull()
        );

        // Verify that the imported application has the expected unconfigured datasources
        assertThat(importedArtifact.getUnConfiguredDatasourceList()).isNotEmpty();
    }

    @TestTemplate
    void testImportWithRemoteBranches(GitImportContext context, ExtensionContext extensionContext) {
        // Create and configure the artifact to get workspace ID
        Artifact artifact = artifactBuilderExtension.buildArtifact(context, extensionContext).block();
        String workspaceId = artifact.getWorkspaceId();
        assertThat(artifact).isNotNull();
        assertThat(workspaceId).isNotNull();

        // Set up Git import with a repository containing multiple branches
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(gitServerInitializerExtension.getGitSshUrl("test"));
        gitConnectDTO.setGitProfile(new GitProfile());
        gitConnectDTO.setIsRepoPrivate(false);

        // Import from Git repository
        ApplicationImportDTO importedArtifact = (ApplicationImportDTO) commonGitService
                .importArtifactFromGit(workspaceId, gitConnectDTO, context.getArtifactType())
                .block();
        assertThat(importedArtifact).isNotNull();
        assertThat(importedArtifact.getApplication()).isNotNull();
        assertThat(importedArtifact.getApplication().getGitApplicationMetadata()).isNotNull();

        // List all remote branches
        List<GitBranchDTO> branches = commonGitService.listBranchForArtifact(
                importedArtifact.getApplication().getId(),
                true,
                context.getArtifactType()
        ).block();
        assertThat(branches).isNotNull();
        assertThat(branches).isNotEmpty();

        // Verify we can checkout a remote branch
        String remoteBranch = branches.stream()
                .filter(branch -> branch.getBranchName().startsWith("origin/"))
                .findFirst()
                .map(GitBranchDTO::getBranchName)
                .orElse(null);
        assertThat(remoteBranch).isNotNull();

        Artifact checkedOutArtifact = commonGitService.checkoutBranch(
                importedArtifact.getApplication().getId(),
                remoteBranch,
                true,
                context.getArtifactType()
        ).block();
        assertThat(checkedOutArtifact).isNotNull();
        assertThat(checkedOutArtifact.getGitArtifactMetadata().getBranchName())
                .isEqualTo(remoteBranch.replace("origin/", ""));

        // Verify Git status after checkout
        GitStatusDTO statusDTO = commonGitService.getStatus(
                checkedOutArtifact.getId(),
                true,
                context.getArtifactType()
        ).block();
        assertThat(statusDTO).isNotNull();
        assertThat(statusDTO.getIsClean()).isTrue();
    }

    @TestTemplate
    void testImportAndMergeScenario(GitImportContext context, ExtensionContext extensionContext) {
        // Create and configure the artifact to get workspace ID
        Artifact artifact = artifactBuilderExtension.buildArtifact(context, extensionContext).block();
        String workspaceId = artifact.getWorkspaceId();
        assertThat(artifact).isNotNull();
        assertThat(workspaceId).isNotNull();

        // Set up Git import
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(gitServerInitializerExtension.getGitSshUrl("test"));
        gitConnectDTO.setGitProfile(new GitProfile());
        gitConnectDTO.setIsRepoPrivate(false);

        // Import from Git repository
        ApplicationImportDTO importedArtifact = (ApplicationImportDTO) commonGitService
                .importArtifactFromGit(workspaceId, gitConnectDTO, context.getArtifactType())
                .block();
        assertThat(importedArtifact).isNotNull();
        assertThat(importedArtifact.getApplication()).isNotNull();
        assertThat(importedArtifact.getApplication().getGitApplicationMetadata()).isNotNull();

        // Create a new branch
        GitBranchDTO branchDTO = new GitBranchDTO();
        branchDTO.setBranchName(FEATURE_BRANCH);
        Artifact featureArtifact = commonGitService.createBranch(
                importedArtifact.getApplication().getId(),
                branchDTO,
                context.getArtifactType()
        ).block();
        assertThat(featureArtifact).isNotNull();

        // Make changes in the feature branch
        gitTestUtils.createADiffInArtifact(featureArtifact).block();

        // Commit changes
        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setCommitMessage("feat: add feature changes");
        commitDTO.setDoPush(true);
        String commitResponse = commonGitService.commitArtifact(
                commitDTO,
                featureArtifact.getId(),
                context.getArtifactType()
        ).block();
        assertThat(commitResponse).contains("Committed successfully!");

        // Check merge status
        GitMergeDTO mergeDTO = new GitMergeDTO();
        mergeDTO.setSourceBranch(FEATURE_BRANCH);
        mergeDTO.setDestinationBranch("master");
        MergeStatusDTO mergeStatus = commonGitService.isBranchMergeable(
                featureArtifact.getId(),
                mergeDTO,
                context.getArtifactType()
        ).block();
        assertThat(mergeStatus).isNotNull();
        assertThat(mergeStatus.isMergeAble()).isTrue();

        // Merge feature into master
        MergeStatusDTO mergeResult = commonGitService.mergeBranch(
                featureArtifact.getId(),
                mergeDTO,
                context.getArtifactType()
        ).block();
        assertThat(mergeResult).isNotNull();
        assertThat(mergeResult.getStatus()).contains("FAST_FORWARD");

        // Verify master has the changes
        GitStatusDTO statusDTO = commonGitService.getStatus(
                importedArtifact.getApplication().getId(),
                true,
                context.getArtifactType()
        ).block();
        assertThat(statusDTO).isNotNull();
        assertThat(statusDTO.getIsClean()).isTrue();
    }
}
