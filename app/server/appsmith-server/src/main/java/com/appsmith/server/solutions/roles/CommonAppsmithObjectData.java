package com.appsmith.server.solutions.roles;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Environment;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Map;

/**
 * Represents the fluxes and monos which are cached to be re-used across different view generations
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CommonAppsmithObjectData {

    Flux<Workspace> workspaceFlux;
    Flux<Application> applicationFlux;
    Flux<NewPage> pageFlux;
    Flux<NewAction> actionFlux;
    Flux<ActionCollection> actionCollectionFlux;
    Flux<Datasource> datasourceFlux;
    Flux<Environment> environmentFlux;

    Mono<Map<String, Collection<Application>>> workspaceApplicationMapMono;
    Mono<Map<String, Collection<NewPage>>> applicationPageMapMono;
    Mono<Map<String, Collection<NewAction>>> pageActionMapMono;
    Mono<Map<String, Collection<ActionCollection>>> pageActionCollectionMapMono;
    Mono<Map<String, Collection<Datasource>>> workspaceDatasourceMapMono;
    Mono<Map<String, Collection<Environment>>> workspaceEnvironmentMapMono;

}
