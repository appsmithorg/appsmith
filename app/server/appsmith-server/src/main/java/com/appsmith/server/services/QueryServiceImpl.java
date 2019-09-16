package com.appsmith.server.services;

import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.Query;
import com.appsmith.server.dtos.CommandQueryParams;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.QueryRepository;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.List;

@Slf4j
@Service
public class QueryServiceImpl extends BaseService<QueryRepository, Query, String> implements QueryService {

    PluginService pluginService;

    PluginManager pluginManager;

    @Autowired
    public QueryServiceImpl(Scheduler scheduler,
                            Validator validator,
                            MongoConverter mongoConverter,
                            ReactiveMongoTemplate reactiveMongoTemplate,
                            QueryRepository repository,
                            PluginService pluginService,
                            PluginManager pluginManager) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository);
        this.pluginService = pluginService;
        this.pluginManager = pluginManager;
    }


    @Override
    public Flux<Object> executeQuery(String name, CommandQueryParams params) {
        log.debug("Going to execute query with name: {}", name);

        // 1. Fetch the query from the DB to get the type
        Mono<Query> queryMono = repository.findByName(name)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "query", name))));

        // 2. Instantiate the implementation class based on the query type
        Mono<PluginExecutor> pluginExecutorMono = queryMono.flatMap(queryObj -> {
                    String pluginId = queryObj.getPlugin().getExecutorClass();
                    List<PluginExecutor> executorList = pluginManager.getExtensions(PluginExecutor.class, pluginId);
                    if (executorList.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin"));
                    }
                    return Mono.just(executorList.get(0));
                }
        );

        // 3. Execute the query
        return queryMono
                .zipWith(pluginExecutorMono, (queryObj, pluginExecutor) ->
                        // TODO: The CommandParams is being passed as null here. Move it to interfaces.CommandParams
                        pluginExecutor.execute(queryObj.getCommandTemplate(), null))
                .flatMapIterable(Flux::toIterable);
    }
}
