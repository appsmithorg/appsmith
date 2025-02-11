package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
public class CustomThemeRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Theme> implements CustomThemeRepositoryCE {
    @Override
    public List<Theme> getApplicationThemes(
            String applicationId, AclPermission permission, User currentUser, EntityManager entityManager) {
        BridgeQuery<Theme> appThemeCriteria = Bridge.equal(Theme.Fields.applicationId, applicationId);
        BridgeQuery<Theme> systemThemeCriteria = Bridge.isTrue(Theme.Fields.isSystemTheme);
        return queryBuilder()
                .criteria(Bridge.or(appThemeCriteria, systemThemeCriteria))
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<Theme> getSystemThemes(AclPermission permission, User currentUser, EntityManager entityManager) {
        return queryBuilder()
                .criteria(Bridge.isTrue(Theme.Fields.isSystemTheme))
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public Optional<Theme> getSystemThemeByName(
            String themeName, AclPermission permission, User currentUser, EntityManager entityManager) {
        return queryBuilder()
                .criteria(Bridge.equalIgnoreCase(Theme.Fields.name, themeName).isTrue(Theme.Fields.isSystemTheme))
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .one();
    }

    @Override
    public Optional<Theme> getSystemThemeByName(String themeName, EntityManager entityManager) {
        return queryBuilder()
                .criteria(Bridge.equalIgnoreCase(Theme.Fields.name, themeName).isTrue(Theme.Fields.isSystemTheme))
                .entityManager(entityManager)
                .one();
    }

    public Optional<Boolean> archiveThemeByCriteria(
            BridgeQuery<Theme> criteria, AclPermission permission, User currentUser, EntityManager entityManager) {
        return Optional.of(queryBuilder()
                        .criteria(criteria)
                        .permission(permission, currentUser)
                        .entityManager(entityManager)
                        .updateAll(Bridge.update().set(Theme.Fields.deletedAt, Instant.now()))
                > 0);
    }

    @Modifying
    @Transactional
    @Override
    public Optional<Boolean> archiveByApplicationId(
            String applicationId, AclPermission permission, User currentUser, EntityManager entityManager) {
        return archiveThemeByCriteria(
                Bridge.equal(Theme.Fields.applicationId, applicationId), permission, currentUser, entityManager);
    }

    @Modifying
    @Transactional
    @Override
    public Optional<Boolean> archiveDraftThemesById(
            String editModeThemeId,
            String publishedModeThemeId,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager) {
        BridgeQuery<Theme> criteria = Bridge.<Theme>in(
                        Theme.Fields.id, CollectionUtils.ofNonNulls(editModeThemeId, publishedModeThemeId))
                .isFalse(Theme.Fields.isSystemTheme);
        return archiveThemeByCriteria(criteria, permission, currentUser, entityManager);
    }

    @Override
    public Optional<Integer> executeThemeImportProcedure(
            String id, String unpublishedThemeId, String publishedThemeId, EntityManager entityManager) {
        Query query = entityManager.createNativeQuery(
                "CALL import_theme_to_application(:appId, :unpublishedThemeId, :publishedThemeId)");
        query.setParameter("appId", id);
        query.setParameter("unpublishedThemeId", unpublishedThemeId);
        query.setParameter("publishedThemeId", publishedThemeId);

        return Optional.of(query.executeUpdate());
    }
}
