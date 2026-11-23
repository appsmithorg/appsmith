package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class CustomDatasourceRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Datasource>
        implements CustomDatasourceRepositoryCE {

    @Autowired
    private ReactiveMongoOperations mongoOperations;

    @Override
    public Flux<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission permission) {
        Sort sort = Sort.by(Datasource.Fields.name);
        return queryBuilder()
                .criteria(Bridge.equal(Datasource.Fields.workspaceId, workspaceId))
                .permission(permission)
                .sort(sort)
                .all();
    }

    @Override
    public Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(Bridge.equal(Datasource.Fields.name, name).equal(Datasource.Fields.workspaceId, workspaceId))
                .permission(aclPermission)
                .one();
    }

    @Override
    public Flux<Datasource> findByIdIn(List<String> ids) {
        final BridgeQuery<Datasource> q = Bridge.in(Datasource.Fields.id, ids);
        return queryBuilder().criteria(q).all();
    }

    @Override
    public Flux<Datasource> findAllByIds(List<String> ids, AclPermission permission) {
        final BridgeQuery<Datasource> q = Bridge.in(Datasource.Fields.id, ids);
        return queryBuilder().criteria(q).permission(permission).all();
    }

    @Override
    public Mono<Long> countByDeletedAtNull() {
        final BridgeQuery<Datasource> q = Bridge.isNull(Datasource.Fields.deletedAt);
        return queryBuilder().criteria(q).count();
    }

    @Override
    public Mono<Map<String, Long>> countByPluginIdForDiagnostics() {
        return countByPluginId(notDeleted());
    }

    @Override
    public Mono<Map<String, Long>> countByPluginIdForDiagnostics(Set<String> datasourceIds) {
        List<ObjectId> ids = datasourceIds.stream()
                .filter(ObjectId::isValid)
                .map(ObjectId::new)
                .toList();
        if (ids.isEmpty()) {
            return Mono.just(Map.of());
        }
        return countByPluginId(
                new Criteria().andOperator(notDeleted(), Criteria.where("_id").in(ids)));
    }

    private Mono<Map<String, Long>> countByPluginId(Criteria criteria) {
        Aggregation aggregation = Aggregation.newAggregation(
                        Aggregation.match(criteria),
                        Aggregation.group(Datasource.Fields.pluginId).count().as("count"))
                .withOptions(DiagnosticsValues.AGGREGATION_OPTIONS);
        // The collection name, not the domain class, keeps _id as the stored string.
        return mongoOperations
                .aggregate(aggregation, mongoOperations.getCollectionName(Datasource.class), Document.class)
                .collect(
                        HashMap::new,
                        (counts, group) -> counts.merge(
                                group.get("_id") == null ? "" : group.get("_id").toString(),
                                ((Number) group.get("count")).longValue(),
                                Long::sum));
    }
}
