package com.appsmith.server.helpers.ce.autocommit;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.migrations.JsonSchemaVersions;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;

@Slf4j
@SpringBootTest
@ExtendWith(SpringExtension.class)
public class AutoCommitEligibilityHelperTest {

    @SpyBean
    AutoCommitEligibiltyHelper autoCommitEligibiltyHelper;

    @SpyBean
    CommonGitFileUtils commonGitFileUtils;

    @MockBean
    DSLMigrationUtils dslMigrationUtils;

    @Test
    public void isAutoCommitRequired_WhenClientAndServerAreEligible_VerifyDTOReturnsTrue() {

        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        PageDTO pageDTO = new PageDTO();
        String workspaceId = UUID.randomUUID().toString();

        Mockito.doReturn(Mono.just(Boolean.TRUE))
                .when(autoCommitEligibiltyHelper)
                .isServerAutoCommitRequired(anyString(), any(GitArtifactMetadata.class));

        Mockito.doReturn(Mono.just(Boolean.TRUE))
                .when(autoCommitEligibiltyHelper)
                .isClientMigrationRequired(any(PageDTO.class));

        Mono<AutoCommitTriggerDTO> autoCommitTriggerDTOMono =
                autoCommitEligibiltyHelper.isAutoCommitRequired(workspaceId, gitArtifactMetadata, pageDTO);

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
    public void isAutoCommitRequired_WhenClientAndServerAreNotEligible_VerifyDTOReturnFalse() {

        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        PageDTO pageDTO = new PageDTO();
        String workspaceId = UUID.randomUUID().toString();

        Mockito.doReturn(Mono.just(Boolean.FALSE))
                .when(autoCommitEligibiltyHelper)
                .isServerAutoCommitRequired(anyString(), any(GitArtifactMetadata.class));

        Mockito.doReturn(Mono.just(Boolean.FALSE))
                .when(autoCommitEligibiltyHelper)
                .isClientMigrationRequired(any(PageDTO.class));

        Mono<AutoCommitTriggerDTO> autoCommitTriggerDTOMono =
                autoCommitEligibiltyHelper.isAutoCommitRequired(workspaceId, gitArtifactMetadata, pageDTO);

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
    public void isAutoCommitRequired_WhenOnlyClientIsEligible_VerifyDTOReturnTrue() {

        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        PageDTO pageDTO = new PageDTO();
        String workspaceId = UUID.randomUUID().toString();

        Mockito.doReturn(Mono.just(Boolean.FALSE))
                .when(autoCommitEligibiltyHelper)
                .isServerAutoCommitRequired(anyString(), any(GitArtifactMetadata.class));

        Mockito.doReturn(Mono.just(Boolean.TRUE))
                .when(autoCommitEligibiltyHelper)
                .isClientMigrationRequired(any(PageDTO.class));

        Mono<AutoCommitTriggerDTO> autoCommitTriggerDTOMono =
                autoCommitEligibiltyHelper.isAutoCommitRequired(workspaceId, gitArtifactMetadata, pageDTO);

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
    public void isAutoCommitRequired_WhenOnlyServerIsEligible_VerifyDTOReturnTrue() {

        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        PageDTO pageDTO = new PageDTO();
        String workspaceId = UUID.randomUUID().toString();

        Mockito.doReturn(Mono.just(Boolean.TRUE))
                .when(autoCommitEligibiltyHelper)
                .isServerAutoCommitRequired(anyString(), any(GitArtifactMetadata.class));

        Mockito.doReturn(Mono.just(Boolean.FALSE))
                .when(autoCommitEligibiltyHelper)
                .isClientMigrationRequired(any(PageDTO.class));

        Mono<AutoCommitTriggerDTO> autoCommitTriggerDTOMono =
                autoCommitEligibiltyHelper.isAutoCommitRequired(workspaceId, gitArtifactMetadata, pageDTO);

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
    public void isServerMigrationRequired_WhenJsonSchemaIsNotAhead_ReturnsFalse() {

        String repoName = "test-repo";
        String branchName = "develop";
        String workspaceId = "test-workspace";
        String defaultApplicationId = "default-app";

        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        gitArtifactMetadata.setDefaultApplicationId(defaultApplicationId);
        gitArtifactMetadata.setRepoName(repoName);
        gitArtifactMetadata.setBranchName(branchName);

        Mockito.when(commonGitFileUtils.getMetadataServerSchemaMigrationVersion(
                        workspaceId, defaultApplicationId, branchName, repoName, ArtifactType.APPLICATION))
                .thenReturn(Mono.just(JsonSchemaVersions.serverVersion));

        Mono<Boolean> autoCommitTriggerDTOMono =
                autoCommitEligibiltyHelper.isServerAutoCommitRequired(workspaceId, gitArtifactMetadata);

        StepVerifier.create(autoCommitTriggerDTOMono)
                .assertNext(isServerMigrationRequired ->
                        assertThat(isServerMigrationRequired).isFalse())
                .verifyComplete();
    }

    @Test
    public void isServerMigrationRequired_WhenJsonSchemaIsAhead_ReturnsTrue() {

        String repoName = "test-repo";
        String branchName = "develop";
        String workspaceId = "test-workspace";
        String defaultApplicationId = "default-app";

        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        gitArtifactMetadata.setDefaultApplicationId(defaultApplicationId);
        gitArtifactMetadata.setRepoName(repoName);
        gitArtifactMetadata.setBranchName(branchName);

        Mockito.when(commonGitFileUtils.getMetadataServerSchemaMigrationVersion(
                        workspaceId, defaultApplicationId, branchName, repoName, ArtifactType.APPLICATION))
                .thenReturn(Mono.just(JsonSchemaVersions.serverVersion - 1));

        Mono<Boolean> autoCommitTriggerDTOMono =
                autoCommitEligibiltyHelper.isServerAutoCommitRequired(workspaceId, gitArtifactMetadata);

        StepVerifier.create(autoCommitTriggerDTOMono)
                .assertNext(isServerMigrationRequired ->
                        assertThat(isServerMigrationRequired).isTrue())
                .verifyComplete();
    }

    private PageDTO createPageDTO(Integer dsl_version_number) {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", "value");
        jsonObject.put("version", dsl_version_number);

        Layout layout1 = new Layout();
        layout1.setId("testLayoutId");
        layout1.setDsl(jsonObject);

        PageDTO pageDTO = new PageDTO();
        pageDTO.setId("testPageId");
        pageDTO.setApplicationId("DEFAULT_APP_ID");
        pageDTO.setLayouts(List.of(layout1));

        return pageDTO;
    }

    @Test
    public void isClientMigrationRequired_WhenLatestDslIsNotAhead_ReturnsFalse() {
        Integer dslNumber = 88;
        PageDTO pageDTO = createPageDTO(dslNumber);

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(dslNumber));

        Mono<Boolean> autoCommitTriggerDTOMono = autoCommitEligibiltyHelper.isClientMigrationRequired(pageDTO);

        StepVerifier.create(autoCommitTriggerDTOMono)
                .assertNext(isClientMigrationRequired ->
                        assertThat(isClientMigrationRequired).isFalse())
                .verifyComplete();
    }

    @Test
    public void isClientMigrationRequired_WhenLatestDslIsAhead_ReturnsTrue() {
        Integer dslNumber = 88;
        PageDTO pageDTO = createPageDTO(dslNumber - 1);

        Mockito.when(dslMigrationUtils.getLatestDslVersion()).thenReturn(Mono.just(dslNumber));

        Mono<Boolean> autoCommitTriggerDTOMono = autoCommitEligibiltyHelper.isClientMigrationRequired(pageDTO);

        StepVerifier.create(autoCommitTriggerDTOMono)
                .assertNext(isClientMigrationRequired ->
                        assertThat(isClientMigrationRequired).isTrue())
                .verifyComplete();
    }
}
