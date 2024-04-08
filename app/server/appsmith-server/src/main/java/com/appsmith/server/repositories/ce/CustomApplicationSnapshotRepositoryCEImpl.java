package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import reactor.core.publisher.Mono;

import java.util.List;

public class CustomApplicationSnapshotRepositoryCEImpl extends BaseAppsmithRepositoryImpl<ApplicationSnapshot>
        implements CustomApplicationSnapshotRepositoryCE {

    @Override
    public Mono<ApplicationSnapshot> findWithoutData(String applicationId) {
        BridgeQuery<ApplicationSnapshot> query = Bridge.<ApplicationSnapshot>equal(
                        ApplicationSnapshot.Fields.applicationId, applicationId)
                .equal(ApplicationSnapshot.Fields.chunkOrder, 1);

        List<String> fieldNames = List.of(
                ApplicationSnapshot.Fields.applicationId,
                ApplicationSnapshot.Fields.chunkOrder,
                ApplicationSnapshot.Fields.createdAt,
                ApplicationSnapshot.Fields.updatedAt);
        return queryBuilder().criteria(query).fields(fieldNames).one();
    }
}
