package com.appsmith.server.services;

import com.appsmith.server.domains.Query;
import com.appsmith.server.dtos.CommandQueryParams;
import com.appsmith.server.dtos.Param;
import com.github.mustachejava.DefaultMustacheFactory;
import com.github.mustachejava.Mustache;
import com.github.mustachejava.MustacheFactory;
import reactor.core.publisher.Flux;

import java.io.StringReader;
import java.io.StringWriter;
import java.io.Writer;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

public abstract class OldPluginExecutor {

    /**
     * This function executes the command against a backend datasource.
     * All the variables in commandTemplate of the Query object has already been replaced with actual values
     * by the #replaceTemplate() function
     *
     * @param query
     * @param params
     * @return Flux<Object>
     */
    protected abstract Flux<Object> execute(Query query, CommandQueryParams params);

    /**
     * This function should be run when the plugin is initialized
     */
    protected abstract void init();

    /**
     * This function should be run when the plugin is destroyed
     */
    protected abstract void destroy();

    /**
     * This function replaces the variables in the query commandTemplate with the actual params
     * Executors can override this function to provide their own implementation if they wish to do something custom
     *
     * @param query  Query
     * @param params CommandQueryParams
     */
    protected Query replaceTemplate(Query query, CommandQueryParams params) {
        MustacheFactory mf = new DefaultMustacheFactory();
        Mustache mustache = mf.compile(new StringReader(query.getCommandTemplate()), "commandTemplate");
        Writer writer = new StringWriter();

        Map<String, String> queryMap = new HashMap<>();
        Map<String, String> headerMap = new HashMap<>();
        if (params.getQueryParams() != null) {
            queryMap = params
                    .getQueryParams()
                    .stream()
                    .collect(
                            Collectors.toMap(Param::getKey, Param::getValue,
                                    // Incase there's a conflict, we pick the older value
                                    (oldValue, newValue) -> oldValue));
        }
        if (params.getHeaderParams() != null) {
            headerMap = params
                    .getHeaderParams()
                    .stream()
                    .collect(
                            Collectors.toMap(Param::getKey, Param::getValue,
                                    // Incase there's a conflict, we pick the older value
                                    (oldValue, newValue) -> oldValue));
        }
        mustache.execute(writer, queryMap);

        query.setCommandTemplate(writer.toString());
        return query;
    }
}
