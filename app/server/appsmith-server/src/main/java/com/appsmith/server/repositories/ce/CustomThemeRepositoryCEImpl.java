package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.QTheme;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

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
    public Flux<Theme> getSystemThemes() {
        Criteria criteria = Criteria.where(fieldName(QTheme.theme.isSystemTheme)).is(Boolean.TRUE);
        return queryAll(List.of(criteria), null);
    }

    @Override
    public Mono<Theme> getSystemThemeByName(String themeName) {
        String findNameRegex = String.format("^%s$", Pattern.quote(themeName));
        Criteria criteria = where(fieldName(QTheme.theme.name)).regex(findNameRegex, "i")
                .and(fieldName(QTheme.theme.isSystemTheme)).is(true);
        return queryOne(List.of(criteria), null);
    }
}
