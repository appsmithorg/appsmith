package com.appsmith.server.helpers.ce.autocommit;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.services.FeatureFlagService;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

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
    RedisUtils redisUtils;

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

        Mockito.when(redisUtils.addFileLock(DEFAULT_APPLICATION_ID)).thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(redisUtils.releaseFileLock(DEFAULT_APPLICATION_ID)).thenReturn(Mono.just(Boolean.TRUE));
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

        Mockito.when(commonGitFileUtils.getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, DEFAULT_APPLICATION_ID, REPO_NAME, BRANCH_NAME, ArtifactType.APPLICATION))
                .thenReturn(Mono.just(JsonSchemaVersions.serverVersion));

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

        Mockito.when(commonGitFileUtils.getMetadataServerSchemaMigrationVersion(
                        WORKSPACE_ID, DEFAULT_APPLICATION_ID, REPO_NAME, BRANCH_NAME, ArtifactType.APPLICATION))
                .thenReturn(Mono.just(JsonSchemaVersions.serverVersion - 1));

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
    public void isAutoCommit_whenFeatureIsFlagFalse_returnsAllFalse() {
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
}
