package com.appsmith.server.services.ce;

import reactor.core.publisher.Mono;

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
     * @param bindingValue : The mustache binding value string to be analyzed
     * @param evalVersion  : The evaluated value version of the current app to be used while AST parsing
     * @return A mono of list of strings that represent all valid global references in the binding string
     */
    Mono<Set<String>> getPossibleReferencesFromDynamicBinding(String bindingValue, int evalVersion);

    Mono<Map<String, String>> refactorNameInDynamicBindings(Set<String> bindingValues, String oldName, String newName, int evalVersion);
}
