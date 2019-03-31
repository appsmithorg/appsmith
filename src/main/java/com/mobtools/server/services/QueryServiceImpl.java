package com.mobtools.server.services;

import com.mobtools.server.domains.Query;
import com.mobtools.server.dtos.CommandQueryParams;
import com.mobtools.server.exceptions.MobtoolsException;
import com.mobtools.server.repositories.QueryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Slf4j
@Service
public class QueryServiceImpl extends BaseService<QueryRepository, Query, String> implements QueryService {

    PluginService pluginService;

    @Autowired
    public QueryServiceImpl(Scheduler scheduler,
                            MongoConverter mongoConverter,
                            ReactiveMongoTemplate reactiveMongoTemplate,
                            QueryRepository repository,
                            PluginService pluginService) {
        super(scheduler, mongoConverter, reactiveMongoTemplate, repository);
        this.pluginService = pluginService;
    }


    @Override
    public Flux<Object> executeQuery(String id, CommandQueryParams params) {
        log.debug("Going to execute query with id: {}", id);

        // 1. Fetch the query from the DB to get the type
        Mono<Query> queryMono = repository.findById(id)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new MobtoolsException("Unable to find query by id: " + id))));

        // 2. Instantiate the implementation class based on the query type
        Mono<PluginExecutor> pluginExecutorMono = queryMono.map(queryObj ->
                pluginService.getPluginExecutor(queryObj.getPlugin().getType(), queryObj.getPlugin().getExecutorClass()));

        // 3. Execute the query
        return queryMono
                .zipWith(pluginExecutorMono, (queryObj, pluginExecutor) -> {
                    Query newQueryObj = pluginExecutor.replaceTemplate(queryObj, params);
                    return pluginExecutor.execute(newQueryObj, params);
                })
                .flatMapIterable(Flux::toIterable).subscribeOn(scheduler);
    }

}
