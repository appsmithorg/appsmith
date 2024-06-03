package com.appsmith.server.git.autocommit.helpers;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.external.git.constants.GitConstants;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.AutoCommitTriggerDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.testhelpers.git.GitFileSystemTestHelper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@SpringBootTest
@ExtendWith(SpringExtension.class)
public class AutoCommitEligibilityHelperTest {

    @SpyBean
    AutoCommitEligibilityHelper autoCommitEligibilityHelper;

    @SpyBean
    CommonGitFileUtils commonGitFileUtils;

    @MockBean
    DSLMigrationUtils dslMigrationUtils;

    @MockBean
    FeatureFlagService featureFlagService;

    @MockBean
    GitRedisUtils gitRedisUtils;

    @Autowired
    GitFileSystemTestHelper gitFileSystemTestHelper;

    private static final int RANDOM_DSL_VERSION_NUMBER = 123;
    private static final String REPO_NAME = "test-repo";
    private static final String BRANCH_NAME = "develop";
    private static final String WORKSPACE_ID = "test-workspace";
    private static final String DEFAULT_APPLICATION_ID = "default-app";

    private GitArtifactMetadata createGitMetadata() {
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        gitArtifactMetadata.setDefaultApplicationId(DEFAULT_APPLICATION_ID);
        gitArtifactMetadata.setRepoName(REPO_NAME);
        gitArtifactMetadata.setBranchName(BRANCH_NAME);
        return gitArtifactMetadata;
    }

    private PageDTO createPageDTO(Integer dslVersionNumber) {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", "value");
        jsonObject.put("version", dslVersionNumber);

        Layout layout1 = new Layout();
        layout1.setId("testLayoutId");
        layout1.setDsl(jsonObject);

        PageDTO pageDTO = new PageDTO();
        pageDTO.setId("testPageId");
        pageDTO.setApplicationId("DEFAULT_APP_ID");
        pageDTO.setLayouts(List.of(layout1));

        return pageDTO;
    }

    @BeforeEach
    public void beforeEach() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_git_autocommit_feature_enabled))
                .thenReturn(Mono.just(Boolean.TRUE));

        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_git_server_autocommit_feature_enabled))
                .thenReturn(Mono.just(Boolean.TRUE));

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(RANDOM_DSL_VERSION_NUMBER));

        Mockito.when(gitRedisUtils.addFileLock(
                        DEFAULT_APPLICATION_ID, GitConstants.GitCommandConstants.METADATA, false))
                .thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(gitRedisUtils.releaseFileLock(DEFAULT_APPLICATION_ID)).thenReturn(Mono.just(Boolean.TRUE));
    }

    @Test
    public void isAutoCommitRequired_whenClientAndServerAreEligible_verifyDTOReturnsTrue() {

        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();
        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER - 1);

        // this leads to server migration requirement as true
        Mockito.doReturn(Mono.just(JsonSchemaVersions.serverVersion - 1))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, DEFAULT_APPLICATION_ID, REPO_NAME, BRANCH_NAME, ArtifactType.APPLICATION);

        Mono<AutoCommitTriggerDTO> autoCommitTriggerDTOMono =
                autoCommitEligibilityHelper.isAutoCommitRequired(WORKSPACE_ID, gitArtifactMetadata, pageDTO);

        StepVerifier.create(autoCommitTriggerDTOMono)
                .assertNext(autoCommitTriggerDTO -> {
                    assertThat(autoCommitTriggerDTO.getIsAutoCommitRequired()).isTrue();
                    assertThat(autoCommitTriggerDTO.getIsServerAutoCommitRequired())
                            .isTrue();
                    assertThat(autoCommitTriggerDTO.getIsClientAutoCommitRequired())
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    public void isAutoCommitRequired_whenClientAndServerAreNotEligible_verifyDTOReturnFalse() {

        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();
        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER);

        // this leads to server migration requirement as false
        Mockito.doReturn(Mono.just(JsonSchemaVersions.serverVersion))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, DEFAULT_APPLICATION_ID, REPO_NAME, BRANCH_NAME, ArtifactType.APPLICATION);

        Mono<AutoCommitTriggerDTO> autoCommitTriggerDTOMono =
                autoCommitEligibilityHelper.isAutoCommitRequired(WORKSPACE_ID, gitArtifactMetadata, pageDTO);

        StepVerifier.create(autoCommitTriggerDTOMono)
                .assertNext(autoCommitTriggerDTO -> {
                    assertThat(autoCommitTriggerDTO.getIsAutoCommitRequired()).isFalse();
                    assertThat(autoCommitTriggerDTO.getIsServerAutoCommitRequired())
                            .isFalse();
                    assertThat(autoCommitTriggerDTO.getIsClientAutoCommitRequired())
                            .isFalse();
                })
                .verifyComplete();
    }

    @Test
    public void isAutoCommitRequired_whenOnlyClientIsEligible_verifyDTOReturnTrue() {

        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();
        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER - 1);

        // this leads to server migration requirement as false
        Mockito.doReturn(Mono.just(JsonSchemaVersions.serverVersion))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, DEFAULT_APPLICATION_ID, REPO_NAME, BRANCH_NAME, ArtifactType.APPLICATION);

        Mono<AutoCommitTriggerDTO> autoCommitTriggerDTOMono =
                autoCommitEligibilityHelper.isAutoCommitRequired(WORKSPACE_ID, gitArtifactMetadata, pageDTO);

        StepVerifier.create(autoCommitTriggerDTOMono)
                .assertNext(autoCommitTriggerDTO -> {
                    assertThat(autoCommitTriggerDTO.getIsAutoCommitRequired()).isTrue();
                    assertThat(autoCommitTriggerDTO.getIsServerAutoCommitRequired())
                            .isFalse();
                    assertThat(autoCommitTriggerDTO.getIsClientAutoCommitRequired())
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    public void isAutoCommitRequired_whenOnlyServerIsEligible_verifyDTOReturnTrue() {

        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();
        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER);

        // this leads to server migration requirement as true
        Mockito.doReturn(Mono.just(JsonSchemaVersions.serverVersion - 1))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, DEFAULT_APPLICATION_ID, REPO_NAME, BRANCH_NAME, ArtifactType.APPLICATION);

        Mono<AutoCommitTriggerDTO> autoCommitTriggerDTOMono =
                autoCommitEligibilityHelper.isAutoCommitRequired(WORKSPACE_ID, gitArtifactMetadata, pageDTO);

        StepVerifier.create(autoCommitTriggerDTOMono)
                .assertNext(autoCommitTriggerDTO -> {
                    assertThat(autoCommitTriggerDTO.getIsAutoCommitRequired()).isTrue();
                    assertThat(autoCommitTriggerDTO.getIsServerAutoCommitRequired())
                            .isTrue();
                    assertThat(autoCommitTriggerDTO.getIsClientAutoCommitRequired())
                            .isFalse();
                })
                .verifyComplete();
    }

    @Test
    public void isServerMigrationRequired_whenJsonSchemaIsNotAhead_returnsFalse() {
        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();

        // this leads to server migration requirement as false
        Mockito.doReturn(Mono.just(JsonSchemaVersions.serverVersion))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, DEFAULT_APPLICATION_ID, REPO_NAME, BRANCH_NAME, ArtifactType.APPLICATION);

        Mono<Boolean> isServerMigrationRequiredMono =
                autoCommitEligibilityHelper.isServerAutoCommitRequired(WORKSPACE_ID, gitArtifactMetadata);

        StepVerifier.create(isServerMigrationRequiredMono)
                .assertNext(isServerMigrationRequired ->
                        assertThat(isServerMigrationRequired).isFalse())
                .verifyComplete();
    }

    @Test
    public void isServerMigrationRequired_whenJsonSchemaIsAhead_returnsTrue() {
        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();

        // this leads to server migration requirement as true
        Mockito.doReturn(Mono.just(JsonSchemaVersions.serverVersion - 1))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, DEFAULT_APPLICATION_ID, REPO_NAME, BRANCH_NAME, ArtifactType.APPLICATION);

        Mono<Boolean> isServerMigrationRequiredMono =
                autoCommitEligibilityHelper.isServerAutoCommitRequired(WORKSPACE_ID, gitArtifactMetadata);

        StepVerifier.create(isServerMigrationRequiredMono)
                .assertNext(isServerMigrationRequired ->
                        assertThat(isServerMigrationRequired).isTrue())
                .verifyComplete();
    }

    @Test
    public void isServerMigrationRequired_whenFeatureIsFlagFalse_returnsFalse() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_git_server_autocommit_feature_enabled))
                .thenReturn(Mono.just(Boolean.FALSE));

        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();

        Mono<Boolean> isServerMigrationRequiredMono =
                autoCommitEligibilityHelper.isServerAutoCommitRequired(WORKSPACE_ID, gitArtifactMetadata);

        StepVerifier.create(isServerMigrationRequiredMono)
                .assertNext(isServerMigrationRequired ->
                        assertThat(isServerMigrationRequired).isFalse())
                .verifyComplete();
    }

    @Test
    public void isClientMigrationRequired_whenLatestDslIsNotAhead_returnsFalse() {
        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER);
        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(RANDOM_DSL_VERSION_NUMBER));

        Mono<Boolean> isClientMigrationRequiredMono = autoCommitEligibilityHelper.isClientMigrationRequired(pageDTO);

        StepVerifier.create(isClientMigrationRequiredMono)
                .assertNext(isClientMigrationRequired ->
                        assertThat(isClientMigrationRequired).isFalse())
                .verifyComplete();
    }

    @Test
    public void isClientMigrationRequired_whenLatestDslIsAhead_returnsTrue() {
        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER - 1);
        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(RANDOM_DSL_VERSION_NUMBER));

        Mono<Boolean> isClientMigrationRequiredMono = autoCommitEligibilityHelper.isClientMigrationRequired(pageDTO);

        StepVerifier.create(isClientMigrationRequiredMono)
                .assertNext(isClientMigrationRequired ->
                        assertThat(isClientMigrationRequired).isTrue())
                .verifyComplete();
    }

    @Test
    public void isClientMigrationRequired_whenFeatureFlagIsFalse_returnsFalse() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_git_autocommit_feature_enabled))
                .thenReturn(Mono.just(Boolean.FALSE));

        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER);
        Mono<Boolean> isClientMigrationRequiredMono = autoCommitEligibilityHelper.isClientMigrationRequired(pageDTO);

        StepVerifier.create(isClientMigrationRequiredMono)
                .assertNext(isClientMigrationRequired ->
                        assertThat(isClientMigrationRequired).isFalse())
                .verifyComplete();
    }

    @Test
    public void isAutoCommitRequired_whenFeatureIsFlagFalse_returnsAllFalse() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_git_autocommit_feature_enabled))
                .thenReturn(Mono.just(Boolean.FALSE));

        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_git_server_autocommit_feature_enabled))
                .thenReturn(Mono.just(Boolean.FALSE));

        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();
        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER);

        Mono<AutoCommitTriggerDTO> autoCommitTriggerDTOMono =
                autoCommitEligibilityHelper.isAutoCommitRequired(WORKSPACE_ID, gitArtifactMetadata, pageDTO);

        StepVerifier.create(autoCommitTriggerDTOMono)
                .assertNext(autoCommitTriggerDTO -> {
                    assertThat(autoCommitTriggerDTO.getIsAutoCommitRequired()).isFalse();
                    assertThat(autoCommitTriggerDTO.getIsServerAutoCommitRequired())
                            .isFalse();
                    assertThat(autoCommitTriggerDTO.getIsClientAutoCommitRequired())
                            .isFalse();
                })
                .verifyComplete();
    }

    @Test
    public void isServerMigrationRequired_fileSystemOperation_returnsTrue() throws GitAPIException, IOException {
        ApplicationJson applicationJson = new ApplicationJson();

        Application application = new Application();
        application.setPolicies(new HashSet<>());

        applicationJson.setExportedApplication(application);
        applicationJson.setDatasourceList(List.of());
        applicationJson.setActionCollectionList(List.of());
        applicationJson.setActionList(List.of());
        applicationJson.setCustomJSLibList(List.of());
        applicationJson.setPageList(List.of());
        applicationJson.setPublishedTheme(new Theme());
        applicationJson.setEditModeTheme(new Theme());
        applicationJson.setClientSchemaVersion(JsonSchemaVersions.clientVersion);
        applicationJson.setServerSchemaVersion(JsonSchemaVersions.serverVersion - 1);

        ModifiedResources modifiedResources = new ModifiedResources();
        modifiedResources.setAllModified(true);
        applicationJson.setModifiedResources(new ModifiedResources());

        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();

        try {
            gitFileSystemTestHelper.setupGitRepository(
                    WORKSPACE_ID, DEFAULT_APPLICATION_ID, BRANCH_NAME, REPO_NAME, applicationJson);

            Mono<Boolean> isServerMigrationRequiredMono =
                    autoCommitEligibilityHelper.isServerAutoCommitRequired(WORKSPACE_ID, gitArtifactMetadata);

            StepVerifier.create(isServerMigrationRequiredMono)
                    .assertNext(isServerMigrationRequired ->
                            assertThat(isServerMigrationRequired).isTrue())
                    .verifyComplete();

        } finally {
            gitFileSystemTestHelper.deleteWorkspaceDirectory(WORKSPACE_ID);
        }
    }
}
