package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.ReactiveContextUtils;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Component
@Slf4j
public class CustomThemeRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Theme> implements CustomThemeRepositoryCE {
    @Override
    public Flux<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission) {
        BridgeQuery<Theme> appThemeCriteria = Bridge.equal(Theme.Fields.applicationId, applicationId);
        BridgeQuery<Theme> systemThemeCriteria = Bridge.isTrue(Theme.Fields.isSystemTheme);
        return queryBuilder()
                .criteria(Bridge.or(appThemeCriteria, systemThemeCriteria))
                .permission(aclPermission)
                .all();
    }

    @Override
    public Flux<Theme> getSystemThemes() {
        Mono<User> currentUserMono = ReactiveContextUtils.getCurrentUser();
        return currentUserMono.flatMapMany(user -> {
            if (user == null) {
                return Flux.empty();
            }
            AclPermission permission = AclPermission.READ_THEMES;
            permission.setUser(user);
            return queryBuilder()
                    .criteria(Bridge.isTrue(Theme.Fields.isSystemTheme))
                    .permission(permission)
                    .all();
        });
    }

    @Override
    public Mono<Theme> getSystemThemeByName(String themeName) {
        Mono<User> currentUserMono = ReactiveContextUtils.getCurrentUser();
        return currentUserMono.flatMap(user -> {
            if (user == null) {
                return Mono.empty();
            }
            AclPermission permission = AclPermission.READ_THEMES;
            permission.setUser(user);
            return queryBuilder()
                    .criteria(
                            Bridge.equalIgnoreCase(Theme.Fields.name, themeName).isTrue(Theme.Fields.isSystemTheme))
                    .permission(permission)
                    .one();
        });
    }

    private Mono<Boolean> archiveThemeByCriteria(BridgeQuery<Theme> criteria) {
        Mono<User> currentUserMono = ReactiveContextUtils.getCurrentUser();
        return currentUserMono.flatMap(user -> {
            if (user == null) {
                return Mono.empty();
            }
            AclPermission permission = AclPermission.MANAGE_THEMES;
            permission.setUser(user);
            return queryBuilder()
                    .criteria(criteria)
                    .permission(permission)
                    .updateAll(Bridge.update().set(Theme.Fields.deletedAt, Instant.now()))
                    .map(count -> count > 0);
        });
    }

    @Override
    public Mono<Boolean> archiveByApplicationId(String applicationId) {
        return archiveThemeByCriteria(Bridge.equal(Theme.Fields.applicationId, applicationId));
    }

    @Override
    public Mono<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId) {
        BridgeQuery<Theme> criteria = Bridge.<Theme>in(
                        Theme.Fields.id, CollectionUtils.ofNonNulls(editModeThemeId, publishedModeThemeId))
                .isFalse(Theme.Fields.isSystemTheme);
        return archiveThemeByCriteria(criteria);
    }
}
