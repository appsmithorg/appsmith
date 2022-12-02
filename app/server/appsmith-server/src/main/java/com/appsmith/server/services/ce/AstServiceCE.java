package com.appsmith.server.services.ce;

import com.appsmith.external.models.MustacheBindingToken;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface AstServiceCE {

    /**
     * If the RTS AST endpoints are accessible, use the service to find global references in the binding value
     * If not, then fall back to the string comparison way of breaking down the binding value into words and looking
     * for references
     * In case the AST service returns with an error, throw an exception that propagates to the layout error messages,
     * to let the user know that their on page load actions have not been updated.
     *
     * @param bindingValues : List of mustache binding value strings to be analyzed
     * @param evalVersion  : The evaluated value version of the current app to be used while AST parsing
     * @return A mono of list of strings that represent all valid global references in the binding string
     */
    Flux<Tuple2<String, Set<String>>> getPossibleReferencesFromDynamicBinding(List<String> bindingValues, int evalVersion);

    Mono<Map<MustacheBindingToken, String>> refactorNameInDynamicBindings(Set<MustacheBindingToken> bindingValues, String oldName, String newName, int evalVersion, boolean isJSObject);
}
