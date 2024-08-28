package com.appsmith.server.git.autocommit.helpers;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.AutoCommitTriggerDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.featureflags.CachedFeatures;
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
import org.mockito.Mockito;
import org.mockito.stubbing.Answer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitCommandConstantsCE.AUTO_COMMIT_ELIGIBILITY;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@SpringBootTest
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

    JsonSchemaVersions jsonSchemaVersions = new JsonSchemaVersions();

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

    private org.json.JSONObject getPageDSl(Integer dslVersionNumber) {
        org.json.JSONObject jsonObject = new org.json.JSONObject();
        jsonObject.put("version", dslVersionNumber);
        return jsonObject;
    }

    @BeforeEach
    public void beforeEach() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_git_autocommit_feature_enabled))
                .thenReturn(Mono.just(Boolean.TRUE));

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(RANDOM_DSL_VERSION_NUMBER));

        Mockito.when(gitRedisUtils.addFileLock(DEFAULT_APPLICATION_ID, AUTO_COMMIT_ELIGIBILITY))
                .thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(gitRedisUtils.releaseFileLock(DEFAULT_APPLICATION_ID)).thenReturn(Mono.just(Boolean.TRUE));
    }

    @Test
    public void isAutoCommitRequired_whenClientAndServerAreEligible_verifyDTOReturnsTrue() {

        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();
        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER - 1);

        Mockito.doReturn(Mono.just(getPageDSl(RANDOM_DSL_VERSION_NUMBER - 1)))
                .when(commonGitFileUtils)
                .getPageDslVersionNumber(
                        WORKSPACE_ID, gitArtifactMetadata, pageDTO, Boolean.TRUE, ArtifactType.APPLICATION);

        // this leads to server migration requirement as true
        Mockito.doReturn(Mono.just(jsonSchemaVersions.getServerVersion() - 1))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, gitArtifactMetadata, Boolean.TRUE, ArtifactType.APPLICATION);

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

        Mockito.doReturn(Mono.just(getPageDSl(RANDOM_DSL_VERSION_NUMBER)))
                .when(commonGitFileUtils)
                .getPageDslVersionNumber(
                        WORKSPACE_ID, gitArtifactMetadata, pageDTO, Boolean.TRUE, ArtifactType.APPLICATION);

        // this leads to server migration requirement as false
        Mockito.doReturn(Mono.just(jsonSchemaVersions.getServerVersion()))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, gitArtifactMetadata, Boolean.FALSE, ArtifactType.APPLICATION);

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

        Mockito.doReturn(Mono.just(getPageDSl(RANDOM_DSL_VERSION_NUMBER - 1)))
                .when(commonGitFileUtils)
                .getPageDslVersionNumber(
                        WORKSPACE_ID, gitArtifactMetadata, pageDTO, Boolean.TRUE, ArtifactType.APPLICATION);

        // this leads to server migration requirement as false
        Mockito.doReturn(Mono.just(jsonSchemaVersions.getServerVersion()))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, gitArtifactMetadata, Boolean.FALSE, ArtifactType.APPLICATION);

        Mono<AutoCommitTriggerDTO> autoCommitTriggerDTOMono =
                autoCommitEligibilityHelper.isAutoCommitRequired(WORKSPACE_ID, gitArtifactMetadata, pageDTO);

        StepVerifier.create(autoCommitTriggerDTOMono)
                .assertNext(autoCommitTriggerDTO -> {
                    assertThat(autoCommitTriggerDTO.getIsAutoCommitRequired()).isTrue();
                    // Since client is true, server is true as well
                    assertThat(autoCommitTriggerDTO.getIsServerAutoCommitRequired())
                            .isTrue();
                    assertThat(autoCommitTriggerDTO.getIsClientAutoCommitRequired())
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    public void isAutoCommitRequired_whenOnlyServerIsEligible_verifyDTOReturnTrue() {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.release_git_autocommit_feature_enabled.name(), TRUE));

        Mockito.when(featureFlagService.getCachedTenantFeatureFlags())
                .thenAnswer((Answer<CachedFeatures>) invocations -> cachedFeatures);

        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();
        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER);

        Mockito.doReturn(Mono.just(getPageDSl(RANDOM_DSL_VERSION_NUMBER)))
                .when(commonGitFileUtils)
                .getPageDslVersionNumber(
                        WORKSPACE_ID, gitArtifactMetadata, pageDTO, Boolean.TRUE, ArtifactType.APPLICATION);

        // this leads to server migration requirement as true
        Mockito.doReturn(Mono.just(jsonSchemaVersions.getServerVersion() - 1))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, gitArtifactMetadata, Boolean.FALSE, ArtifactType.APPLICATION);

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
        Mockito.doReturn(Mono.just(jsonSchemaVersions.getServerVersion()))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, gitArtifactMetadata, Boolean.TRUE, ArtifactType.APPLICATION);

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

        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.release_git_autocommit_feature_enabled.name(), TRUE));

        Mockito.when(featureFlagService.getCachedTenantFeatureFlags())
                .thenAnswer((Answer<CachedFeatures>) invocations -> cachedFeatures);

        // this leads to server migration requirement as true
        Mockito.doReturn(Mono.just(jsonSchemaVersions.getServerVersion() - 1))
                .when(commonGitFileUtils)
                .getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, gitArtifactMetadata, Boolean.FALSE, ArtifactType.APPLICATION);

        Mono<Boolean> isServerMigrationRequiredMono =
                autoCommitEligibilityHelper.isServerAutoCommitRequired(WORKSPACE_ID, gitArtifactMetadata);

        StepVerifier.create(isServerMigrationRequiredMono)
                .assertNext(isServerMigrationRequired ->
                        assertThat(isServerMigrationRequired).isTrue())
                .verifyComplete();
    }

    @Test
    public void isServerMigrationRequired_whenFeatureIsFlagFalse_returnsFalse() {

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
        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();
        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER);

        Mockito.doReturn(Mono.just(getPageDSl(RANDOM_DSL_VERSION_NUMBER)))
                .when(commonGitFileUtils)
                .getPageDslVersionNumber(
                        WORKSPACE_ID, gitArtifactMetadata, pageDTO, Boolean.TRUE, ArtifactType.APPLICATION);

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(RANDOM_DSL_VERSION_NUMBER));

        Mono<Boolean> isClientMigrationRequiredMono =
                autoCommitEligibilityHelper.isClientMigrationRequiredFSOps(WORKSPACE_ID, gitArtifactMetadata, pageDTO);

        StepVerifier.create(isClientMigrationRequiredMono)
                .assertNext(isClientMigrationRequired ->
                        assertThat(isClientMigrationRequired).isFalse())
                .verifyComplete();
    }

    @Test
    public void isClientMigrationRequired_whenLatestDslIsAhead_returnsTrue() {
        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();
        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER - 1);

        Mockito.doReturn(Mono.just(getPageDSl(RANDOM_DSL_VERSION_NUMBER - 1)))
                .when(commonGitFileUtils)
                .getPageDslVersionNumber(
                        WORKSPACE_ID, gitArtifactMetadata, pageDTO, Boolean.TRUE, ArtifactType.APPLICATION);

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(RANDOM_DSL_VERSION_NUMBER));

        Mono<Boolean> isClientMigrationRequiredMono =
                autoCommitEligibilityHelper.isClientMigrationRequiredFSOps(WORKSPACE_ID, gitArtifactMetadata, pageDTO);

        StepVerifier.create(isClientMigrationRequiredMono)
                .assertNext(isClientMigrationRequired ->
                        assertThat(isClientMigrationRequired).isTrue())
                .verifyComplete();
    }

    @Test
    public void isClientMigrationRequired_whenFeatureFlagIsFalse_returnsFalse() {

        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER);
        Mono<Boolean> isClientMigrationRequiredMono = autoCommitEligibilityHelper.isClientMigrationRequired(pageDTO);

        StepVerifier.create(isClientMigrationRequiredMono)
                .assertNext(isClientMigrationRequired ->
                        assertThat(isClientMigrationRequired).isFalse())
                .verifyComplete();
    }

    @Test
    public void isAutoCommitRequired_whenFeatureIsFlagFalse_returnsAllFalse() {

        GitArtifactMetadata gitArtifactMetadata = createGitMetadata();
        PageDTO pageDTO = createPageDTO(RANDOM_DSL_VERSION_NUMBER - 1);

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
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.release_git_autocommit_feature_enabled.name(), TRUE));

        Mockito.when(featureFlagService.getCachedTenantFeatureFlags())
                .thenAnswer((Answer<CachedFeatures>) invocations -> cachedFeatures);

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
        applicationJson.setClientSchemaVersion(jsonSchemaVersions.getClientVersion());
        applicationJson.setServerSchemaVersion(jsonSchemaVersions.getServerVersion() - 1);

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
