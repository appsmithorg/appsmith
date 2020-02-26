package com.appsmith.server.configurations.mongo;

import com.appsmith.server.domains.User;
import com.appsmith.server.services.AclEntity;
import com.appsmith.server.services.AclPermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.repository.query.ConvertingParameterAccessor;
import org.springframework.data.mongodb.repository.query.ReactiveMongoQueryMethod;
import org.springframework.data.mongodb.repository.query.ReactivePartTreeMongoQuery;
import org.springframework.data.projection.ProjectionFactory;
import org.springframework.data.repository.core.NamedQueries;
import org.springframework.data.repository.core.RepositoryMetadata;
import org.springframework.data.repository.query.QueryLookupStrategy;
import org.springframework.data.repository.query.QueryMethodEvaluationContextProvider;
import org.springframework.data.repository.query.RepositoryQuery;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Method;
import java.util.ArrayList;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * This class overrides the default implementation in
 * {@link org.springframework.data.mongodb.repository.support.ReactiveMongoRepositoryFactory#getQueryLookupStrategy}
 * This custom implementation adds the query parameter to filter out any records marked with delete=true in the database
 * <p>
 * Also refer to the custom Factory: {@link SoftDeleteMongoRepositoryFactory} and
 * custom FactoryBean: {@link SoftDeleteMongoRepositoryFactoryBean}. The annotation @EnableReactiveMongoRepositories in
 * {@link com.appsmith.server.configurations.CommonConfig} sets the Mongo factory bean to our custom bean instead of the default one
 */
@Slf4j
public class SoftDeleteMongoQueryLookupStrategy implements QueryLookupStrategy {
    private final QueryLookupStrategy strategy;
    private final ReactiveMongoOperations mongoOperations;
    private static final SpelExpressionParser EXPRESSION_PARSER = new SpelExpressionParser();
    QueryMethodEvaluationContextProvider evaluationContextProvider = QueryMethodEvaluationContextProvider.DEFAULT;
    private ExpressionParser expressionParser = new SpelExpressionParser();

    public SoftDeleteMongoQueryLookupStrategy(QueryLookupStrategy strategy,
                                              ReactiveMongoOperations mongoOperations) {
        this.strategy = strategy;
        this.mongoOperations = mongoOperations;
    }

    @Override
    public RepositoryQuery resolveQuery(Method method, RepositoryMetadata metadata, ProjectionFactory factory,
                                        NamedQueries namedQueries) {
        RepositoryQuery repositoryQuery = strategy.resolveQuery(method, metadata, factory, namedQueries);

        // revert to the standard behavior if requested
        if (method.getAnnotation(CanSeeSoftDeletedRecords.class) != null) {
            return repositoryQuery;
        }
        AclEntity aclEntityAnnotation = method.getDeclaringClass().getAnnotation(AclEntity.class);

        if (!(repositoryQuery instanceof ReactivePartTreeMongoQuery)) {
            return repositoryQuery;
        }
        ReactivePartTreeMongoQuery partTreeQuery = (ReactivePartTreeMongoQuery) repositoryQuery;

        return new SoftDeletePartTreeMongoQuery(method, partTreeQuery);
    }

    private Criteria notDeleted() {
        return new Criteria().orOperator(
                where("deleted").exists(false),
                where("deleted").is(false)
        );
    }

    private class SoftDeletePartTreeMongoQuery extends ReactivePartTreeMongoQuery {
        private ReactivePartTreeMongoQuery reactivePartTreeQuery;
        private Method method;

        SoftDeletePartTreeMongoQuery(Method method, ReactivePartTreeMongoQuery reactivePartTreeMongoQuery) {
            super((ReactiveMongoQueryMethod) reactivePartTreeMongoQuery.getQueryMethod(),
                    mongoOperations, EXPRESSION_PARSER, evaluationContextProvider);
            this.reactivePartTreeQuery = reactivePartTreeMongoQuery;
            this.method = method;
        }

        @Override
        protected Query createQuery(ConvertingParameterAccessor accessor) {
//            SecurityContext securityContext = SecurityContextHolder.getContext();
//            User userPrincipal = ReactiveSecurityContextHolder.getContext()
//                    .switchIfEmpty(Mono.error(new Exception("no context")))
//                    .map(ctx -> ctx.getAuthentication())
//                    .map(auth -> auth.getPrincipal())
//                    .map(principal -> {
//                        if (principal instanceof User) {
//                            return (User) principal;
//                        }
//                        return new User();
//                    }).block();
            AclPermission aclPermission = method.getAnnotation(AclPermission.class);
            if (aclPermission != null) {
                log.debug("Got principal: {}", aclPermission.principal());
            }
            Query query = super.createQuery(accessor);
            return withNotDeleted(query);
        }

        @Override
        protected Query createCountQuery(ConvertingParameterAccessor accessor) {
            Query query = super.createCountQuery(accessor);
            return withNotDeleted(query);
        }

        private Query withNotDeleted(Query query) {
            return query.addCriteria(notDeleted());
        }
    }
}
