package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QTheme;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
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
import java.util.List;
import java.util.regex.Pattern;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomThemeRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Theme> implements CustomThemeRepositoryCE {
    public CustomThemeRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }


    @Override
    public Flux<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission) {
        Criteria appThemeCriteria = Criteria.where(fieldName(QTheme.theme.applicationId)).is(applicationId);
        Criteria systemThemeCriteria = Criteria.where(fieldName(QTheme.theme.isSystemTheme)).is(Boolean.TRUE);
        Criteria criteria = new Criteria().orOperator(appThemeCriteria, systemThemeCriteria);
        return queryAll(List.of(criteria), aclPermission);
    }

    @Override
    public Flux<Theme> getSystemThemes() {
        Criteria systemThemeCriteria = Criteria.where(fieldName(QTheme.theme.isSystemTheme)).is(Boolean.TRUE);
        return queryAll(List.of(systemThemeCriteria), AclPermission.READ_THEMES);
    }

    @Override
    public Mono<Theme> getSystemThemeByName(String themeName) {
        String findNameRegex = String.format("^%s$", Pattern.quote(themeName));
        Criteria criteria = where(fieldName(QTheme.theme.name)).regex(findNameRegex, "i")
                .and(fieldName(QTheme.theme.isSystemTheme)).is(true);
        return queryOne(List.of(criteria), AclPermission.READ_THEMES);
    }

    private Mono<Boolean> archiveThemeByCriteria(Criteria criteria) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .flatMap(auth -> {
                    User user = (User) auth.getPrincipal();
                    Criteria permissionCriteria = userAcl(user, AclPermission.MANAGE_THEMES);

                    Update update = new Update();
                    update.set(fieldName(QTheme.theme.deleted), true);
                    update.set(fieldName(QTheme.theme.deletedAt), Instant.now());
                    return updateByCriteria(List.of(criteria, permissionCriteria), update);
                }).map(updateResult -> updateResult.getModifiedCount() > 0);
    }

    @Override
    public Mono<Boolean> archiveByApplicationId(String applicationId) {
        return archiveThemeByCriteria(where(fieldName(QTheme.theme.applicationId)).is(applicationId));
    }

    @Override
    public Mono<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId) {
        Criteria criteria = where(fieldName(QTheme.theme.id)).in(editModeThemeId, publishedModeThemeId)
                .and(fieldName(QTheme.theme.isSystemTheme)).is(false);
        return archiveThemeByCriteria(criteria);
    }
}
