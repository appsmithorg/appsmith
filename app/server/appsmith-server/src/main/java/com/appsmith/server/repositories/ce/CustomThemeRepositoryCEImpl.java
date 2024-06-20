package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
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
    public List<Theme> getApplicationThemes(String applicationId, AclPermission permission, User currentUser) {
        BridgeQuery<Theme> appThemeCriteria = Bridge.equal(Theme.Fields.applicationId, applicationId);
        BridgeQuery<Theme> systemThemeCriteria = Bridge.isTrue(Theme.Fields.isSystemTheme);
        return queryBuilder()
                .criteria(Bridge.or(appThemeCriteria, systemThemeCriteria))
                .permission(permission)
                .user(currentUser)
                .all();
    }

    @Override
    public List<Theme> getSystemThemes() {
        return queryBuilder()
                .criteria(Bridge.isTrue(Theme.Fields.isSystemTheme))
                .all();
    }

    @Override
    public Optional<Theme> getSystemThemeByName(String themeName, AclPermission permission, User currentUser) {
        return queryBuilder()
                .criteria(Bridge.equalIgnoreCase(Theme.Fields.name, themeName).isTrue(Theme.Fields.isSystemTheme))
                .permission(permission)
                .user(currentUser)
                .one();
    }

    public Optional<Boolean> archiveThemeByCriteria(
            BridgeQuery<Theme> criteria, AclPermission permission, User currentUser) {
        return Optional.of(queryBuilder()
                        .criteria(criteria)
                        .permission(permission)
                        .user(currentUser)
                        .updateAll(Bridge.update().set(Theme.Fields.deletedAt, Instant.now()))
                > 0);
    }

    @Modifying
    @Transactional
    @Override
    public Optional<Boolean> archiveByApplicationId(String applicationId, AclPermission permission, User currentUser) {
        return archiveThemeByCriteria(Bridge.equal(Theme.Fields.applicationId, applicationId), permission, currentUser);
    }

    @Modifying
    @Transactional
    @Override
    public Optional<Boolean> archiveDraftThemesById(
            String editModeThemeId, String publishedModeThemeId, AclPermission permission, User currentUser) {
        BridgeQuery<Theme> criteria = Bridge.<Theme>in(
                        Theme.Fields.id, CollectionUtils.ofNonNulls(editModeThemeId, publishedModeThemeId))
                .isFalse(Theme.Fields.isSystemTheme);
        return archiveThemeByCriteria(criteria, permission, currentUser);
    }
}
