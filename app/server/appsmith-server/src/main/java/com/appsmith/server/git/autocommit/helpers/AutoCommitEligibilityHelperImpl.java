package com.appsmith.server.git.autocommit.helpers;

import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.AutoCommitTriggerDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.migrations.JsonSchemaVersions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static com.appsmith.external.git.constants.GitConstants.GitCommandConstants.AUTO_COMMIT_ELIGIBILITY;
import static com.appsmith.server.constants.ArtifactType.APPLICATION;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@Primary
@Component
@RequiredArgsConstructor
public class AutoCommitEligibilityHelperImpl extends AutoCommitEligibilityHelperFallbackImpl
        implements AutoCommitEligibilityHelper {

    private final CommonGitFileUtils commonGitFileUtils;
    private final DSLMigrationUtils dslMigrationUtils;
    private final GitRedisUtils gitRedisUtils;
    private final JsonSchemaVersions jsonSchemaVersions;

    @Override
    public Mono<Boolean> isServerAutoCommitRequired(String workspaceId, GitArtifactMetadata gitMetadata) {

        String defaultApplicationId = gitMetadata.getDefaultArtifactId();
        String branchName = gitMetadata.getBranchName();

        Mono<Boolean> isServerMigrationRequiredMonoCached = commonGitFileUtils
                .getMetadataServerSchemaMigrationVersion(workspaceId, gitMetadata, FALSE, APPLICATION)
                .map(serverSchemaVersion -> {
                    log.info(
                            "server schema for application id : {}  and branch name : {} is : {}",
                            defaultApplicationId,
                            branchName,
                            serverSchemaVersion);
                    return jsonSchemaVersions.getServerVersion() > serverSchemaVersion ? TRUE : FALSE;
                })
                .defaultIfEmpty(FALSE)
                .cache();

        return Mono.defer(() -> isServerMigrationRequiredMonoCached).onErrorResume(error -> {
            log.debug(
                    "error while retrieving the metadata for defaultApplicationId : {}, branchName : {} error : {}",
                    defaultApplicationId,
                    branchName,
                    error.getMessage());
            return Mono.just(FALSE);
        });
    }

    /**
     * This method has been deprecated and is not being used anymore.
     * It's been deprecated because, we are using the absolute source of truth
     * that is the version key in the layout.
     * /pages/<Page-Name>.json in file system for the finding out the Dsl in layout.
     * @param pageDTO : pageDTO for the page for which migration was required.
     * @return : a boolean whether the client requires a migration or not
     */
    @Override
    @Deprecated
    public Mono<Boolean> isClientMigrationRequired(PageDTO pageDTO) {
        return dslMigrationUtils
                .getLatestDslVersion()
                .map(latestDslVersion -> {
                    // ensuring that the page has only one layout, as we don't support multiple layouts yet
                    // when multiple layouts are supported, this code will have to be updated
                    assert pageDTO.getLayouts().size() == 1;
                    Layout layout = pageDTO.getLayouts().get(0);
                    JSONObject layoutDsl = layout.getDsl();
                    return GitUtils.isMigrationRequired(layoutDsl, latestDslVersion);
                })
                .defaultIfEmpty(FALSE)
                .onErrorResume(error -> {
                    log.debug("Error fetching latest DSL version");
                    return Mono.just(Boolean.FALSE);
                });
    }

    @Override
    public Mono<Boolean> isClientMigrationRequiredFSOps(
            String workspaceId, GitArtifactMetadata gitMetadata, PageDTO pageDTO) {
        String defaultApplicationId = gitMetadata.getDefaultArtifactId();
        String branchName = gitMetadata.getBranchName();

        Mono<Integer> latestDslVersionMono = dslMigrationUtils.getLatestDslVersion();

        Mono<Boolean> isClientMigrationRequired = latestDslVersionMono
                .zipWith(commonGitFileUtils.getPageDslVersionNumber(
                        workspaceId, gitMetadata, pageDTO, TRUE, APPLICATION))
                .map(tuple2 -> {
                    Integer latestDslVersion = tuple2.getT1();
                    org.json.JSONObject pageDSL = tuple2.getT2();
                    log.info("page dsl retrieved from file system");
                    return GitUtils.isMigrationRequired(pageDSL, latestDslVersion);
                })
                .defaultIfEmpty(FALSE)
                .cache();

        return Mono.defer(() -> isClientMigrationRequired).onErrorResume(error -> {
            log.debug(
                    "error while fetching the dsl version for page : {}, defaultApplicationId : {}, branchName : {} error : {}",
                    pageDTO.getName(),
                    defaultApplicationId,
                    branchName,
                    error.getMessage());
            return Mono.just(FALSE);
        });
    }

    @Override
    public Mono<AutoCommitTriggerDTO> isAutoCommitRequired(
            String workspaceId, GitArtifactMetadata gitArtifactMetadata, PageDTO pageDTO) {

        String defaultApplicationId = gitArtifactMetadata.getDefaultApplicationId();

        Mono<Boolean> isClientAutocommitRequiredMono =
                isClientMigrationRequiredFSOps(workspaceId, gitArtifactMetadata, pageDTO);

        Mono<Boolean> isServerAutocommitRequiredMono =
                isServerAutoCommitRequired(workspaceId, gitArtifactMetadata).cache();

        return Mono.defer(() -> gitRedisUtils.addFileLock(defaultApplicationId, AUTO_COMMIT_ELIGIBILITY))
                .then(isClientAutocommitRequiredMono.zipWhen(clientFlag -> {
                    Mono<Boolean> serverFlagMono = isServerAutocommitRequiredMono;
                    // if client is required to migrate then,
                    // there is no requirement to fetch server flag as server is subset of client migration.
                    if (Boolean.TRUE.equals(clientFlag)) {
                        serverFlagMono = Mono.just(TRUE);
                    }

                    return serverFlagMono;
                }))
                .flatMap(tuple2 -> {
                    Boolean clientFlag = tuple2.getT1();
                    Boolean serverFlag = tuple2.getT2();

                    AutoCommitTriggerDTO autoCommitTriggerDTO = new AutoCommitTriggerDTO();
                    autoCommitTriggerDTO.setIsClientAutoCommitRequired(TRUE.equals(clientFlag));
                    autoCommitTriggerDTO.setIsServerAutoCommitRequired(TRUE.equals(serverFlag));
                    autoCommitTriggerDTO.setIsAutoCommitRequired((TRUE.equals(serverFlag) || TRUE.equals(clientFlag)));

                    return gitRedisUtils.releaseFileLock(defaultApplicationId).then(Mono.just(autoCommitTriggerDTO));
                });
    }
}
