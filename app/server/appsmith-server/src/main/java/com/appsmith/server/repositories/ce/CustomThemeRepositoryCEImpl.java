package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.regex.Pattern;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomThemeRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Theme> implements CustomThemeRepositoryCE {
    public CustomThemeRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission) {
        Criteria appThemeCriteria = Criteria.where(Theme.Fields.applicationId).is(applicationId);
        Criteria systemThemeCriteria =
                Criteria.where(Theme.Fields.isSystemTheme).is(Boolean.TRUE);
        Criteria criteria = new Criteria().orOperator(appThemeCriteria, systemThemeCriteria);
        return queryBuilder().criteria(criteria).permission(aclPermission).all();
    }

    @Override
    public Flux<Theme> getSystemThemes() {
        Criteria systemThemeCriteria =
                Criteria.where(Theme.Fields.isSystemTheme).is(Boolean.TRUE);
        return queryBuilder()
                .criteria(systemThemeCriteria)
                .permission(AclPermission.READ_THEMES)
                .all();
    }

    @Override
    public Mono<Theme> getSystemThemeByName(String themeName) {
        String findNameRegex = String.format("^%s$", Pattern.quote(themeName));
        Criteria criteria = where(Theme.Fields.name)
                .regex(findNameRegex, "i")
                .and(Theme.Fields.isSystemTheme)
                .is(true);
        return queryBuilder()
                .criteria(criteria)
                .permission(AclPermission.READ_THEMES)
                .one();
    }

    private Mono<Boolean> archiveThemeByCriteria(Criteria criteria) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getAllPermissionGroupsForUser((User) principal))
                .flatMap(permissionGroups -> {
                    Criteria permissionCriteria = userAcl(permissionGroups, AclPermission.MANAGE_THEMES);

                    Update update = new Update();
                    update.set(Theme.Fields.deletedAt, Instant.now());
                    return queryBuilder().criteria(criteria, permissionCriteria).updateAll(update);
                })
                .map(count -> count > 0);
    }

    @Override
    public Mono<Boolean> archiveByApplicationId(String applicationId) {
        return archiveThemeByCriteria(where(Theme.Fields.applicationId).is(applicationId));
    }

    @Override
    public Mono<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId) {
        Criteria criteria = where(Theme.Fields.id)
                .in(editModeThemeId, publishedModeThemeId)
                .and(Theme.Fields.isSystemTheme)
                .is(false);
        return archiveThemeByCriteria(criteria);
    }
}
