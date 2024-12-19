package com.appsmith.server.git;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.git.common.CommonGitService;
import com.appsmith.server.git.templates.contexts.GitContext;
import com.appsmith.server.git.templates.providers.GitBranchesTestTemplateProvider;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * This integration test suite template is meant to be executed for artifacts that were initially not git connected,
 * and then were connected to an empty git repository. We only work with branches in this suite.
 * We use an older schema of an artifact as the golden use case, and perform the following operations:
 * - Connect to git
 * - Check for auto commit
 * - Check for default branch
 * - Check for protected branch
 * - Make changes to base branch, verify status
 * - Set up a protected branch
 * - Check for protected branch functionalities
 * - Create a new branch `foo`, verify checkout and status
 * - Create a new branch `bar`, verify checkout and no status
 * - Make changes on `bar`, commit and attempt to merge to master
 * - Delete `foo` branch locally and re-populate from remote
 * - Verify latest commit on `foo` should be with changes made on master
 * - Make more changes and attempt discard
 * - Switch default branch to `foo`
 * - Verify consolidated response switches to `foo` by default on edit and view mode
 * - Disconnect artifact and verify non-existence of `master` and `bar`
 */
@Testcontainers
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class GitBranchesIT {

    @Autowired
    @RegisterExtension
    public GitBranchesTestTemplateProvider templateProvider;

    @Autowired
    @RegisterExtension
    public ArtifactBuilderExtension artifactBuilderExtension;

    @Autowired
    @RegisterExtension
    public GitServerInitializerExtension gitServerInitializerExtension;

    @Autowired
    CommonGitService commonGitService;

    private final String ORIGIN = "https://foo.bar.com";

    @TestTemplate
    @WithUserDetails(value = "api_user")
    void test(GitContext gitContext, ExtensionContext extensionContext) {

        ExtensionContext.Store contextStore = extensionContext.getStore(ExtensionContext.Namespace.create(ArtifactBuilderExtension.class));
        String artifactId = contextStore.get(FieldName.ARTIFACT_ID, String.class);

        GitConnectDTO connectDTO = new GitConnectDTO();
        connectDTO.setRemoteUrl(gitServerInitializerExtension.getGitSshUrl("test"));
        GitProfile gitProfile = new GitProfile("foo bar", "foo@bar.com", null);
        connectDTO.setGitProfile(gitProfile);

        // TODO:
        //  - Move the filePath variable to be relative, so that template name and repo name is prettier
        //  - Is it possible to use controller layer here? Might help with also including web filters in IT
        Artifact artifact = commonGitService.connectArtifactToGit(artifactId, connectDTO, ORIGIN, gitContext.getArtifactType())
            .block();

        assertThat(artifact).isNotNull();
    }
}
