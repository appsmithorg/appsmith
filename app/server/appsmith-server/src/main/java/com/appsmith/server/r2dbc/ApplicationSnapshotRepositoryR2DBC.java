package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ApplicationSnapshotRepositoryR2DBC extends BaseR2DBCRepository<ApplicationSnapshot, String> {

    @Query(
            "SELECT * FROM application_snapshot WHERE application_id = :applicationId AND deleted_at IS NULL ORDER BY created_at DESC")
    Flux<ApplicationSnapshot> findByApplicationId(String applicationId);

    @Query(
            "SELECT * FROM application_snapshot WHERE application_id = :applicationId AND branch_name = :branchName AND deleted_at IS NULL")
    Mono<ApplicationSnapshot> findByApplicationIdAndBranchName(String applicationId, String branchName);
}
