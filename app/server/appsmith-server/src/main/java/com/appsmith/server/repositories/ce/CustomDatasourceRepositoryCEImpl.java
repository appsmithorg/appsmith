package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.StoredProcedureQuery;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

public class CustomDatasourceRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Datasource>
        implements CustomDatasourceRepositoryCE {

    @Override
    public List<Datasource> findAllByWorkspaceId(
            String workspaceId, AclPermission permission, User currentUser, EntityManager entityManager) {
        Sort sort = Sort.by(Datasource.Fields.name);
        return queryBuilder()
                .criteria(Bridge.equal(Datasource.Fields.workspaceId, workspaceId))
                .permission(permission, currentUser)
                .sort(sort)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public Optional<Datasource> findByNameAndWorkspaceId(
            String name, String workspaceId, AclPermission permission, User currentUser, EntityManager entityManager) {
        return queryBuilder()
                .criteria(Bridge.equal(Datasource.Fields.name, name).equal(Datasource.Fields.workspaceId, workspaceId))
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .one();
    }

    @Override
    public List<Datasource> findByIdIn(List<String> ids, EntityManager entityManager) {
        final BridgeQuery<Datasource> q = Bridge.in(Datasource.Fields.id, ids);
        return queryBuilder().criteria(q).entityManager(entityManager).all();
    }

    @Override
    public Optional<Long> countByDeletedAtNull(EntityManager entityManager) {
        final BridgeQuery<Datasource> q = Bridge.isNull(Datasource.Fields.deletedAt);
        return queryBuilder().criteria(q).entityManager(entityManager).count();
    }

    @Override
    public Optional<Integer> executeDatasourceImport(
            String artifactId,
            String workspaceId,
            String pluginMap,
            String importedDatasources,
            String decryptedFields,
            EntityManager entityManager) {

        StoredProcedureQuery query = entityManager.createStoredProcedureQuery("import_datasources");

        query.registerStoredProcedureParameter(1, String.class, ParameterMode.IN);
        query.registerStoredProcedureParameter(2, String.class, ParameterMode.IN);
        query.registerStoredProcedureParameter(3, String.class, ParameterMode.IN);
        query.registerStoredProcedureParameter(4, String.class, ParameterMode.IN);
        query.registerStoredProcedureParameter(5, String.class, ParameterMode.IN);
        query.registerStoredProcedureParameter(6, String.class, ParameterMode.OUT);

        query.setParameter(1, artifactId);
        query.setParameter(2, workspaceId);
        query.setParameter(3, pluginMap + "::jsonb");
        query.setParameter(4, importedDatasources + "::jsonb");
        query.setParameter(5, decryptedFields + "::jsonb");

        query.execute();

        String outputJson = (String) query.getOutputParameterValue(6);

        /*Query query = entityManager.createNativeQuery(
                "CALL appsmith.import_datasources($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, NULL)");
        query.setParameter(1, artifactId);
        query.setParameter(2, workspaceId);
        query.setParameter(3, pluginMap);
        query.setParameter(4, importedDatasources);
        query.setParameter(5, decryptedFields);*/
        return Optional.of(1);
    }
}
