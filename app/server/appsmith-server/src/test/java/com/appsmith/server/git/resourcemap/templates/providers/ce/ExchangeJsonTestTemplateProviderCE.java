package com.appsmith.server.git.resourcemap.templates.providers.ce;

import com.appsmith.external.git.models.GitResourceIdentity;
import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.git.resourcemap.templates.contexts.ExchangeJsonContext;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestTemplateInvocationContext;
import org.junit.jupiter.api.extension.TestTemplateInvocationContextProvider;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

public class ExchangeJsonTestTemplateProviderCE implements TestTemplateInvocationContextProvider {

    @Override
    public boolean supportsTestTemplate(ExtensionContext extensionContext) {
        return true;
    }

    @Override
    public Stream<TestTemplateInvocationContext> provideTestTemplateInvocationContexts(
            ExtensionContext extensionContext) {
        ExchangeJsonContext c1 = new ExchangeJsonContext("valid-application.json", ApplicationJson.class, 23);
        ExchangeJsonContext c2 = new ExchangeJsonContext(
                "valid-application-with-un-configured-datasource.json", ApplicationJson.class, 12);
        return Stream.of(c1, c2);
    }

    public long assertResourceComparisons(
            ArtifactExchangeJson exchangeJson, Map<GitResourceIdentity, Object> resourceMap) {
        List<Object> datasourceResources = getResourceListByType(resourceMap, GitResourceType.DATASOURCE_CONFIG);
        long resourceMapDatasourceCount = datasourceResources.size();
        int jsonDatasourceCount = exchangeJson.getDatasourceList() != null
                ? exchangeJson.getDatasourceList().size()
                : 0;
        assertThat(resourceMapDatasourceCount).isEqualTo(jsonDatasourceCount);

        List<Object> rootResources = getResourceListByType(resourceMap, GitResourceType.ROOT_CONFIG);
        long resourceMapRootCount = rootResources.size();
        // artifact json, metadata and theme
        assertThat(resourceMapRootCount).isEqualTo(3);

        List<Object> jsLibResources = getResourceListByType(resourceMap, GitResourceType.JSLIB_CONFIG);
        long resourceMapJsLibCount = jsLibResources.size();
        int jsonJsLibCount = exchangeJson.getCustomJSLibList() != null
                ? exchangeJson.getCustomJSLibList().size()
                : 0;
        assertThat(resourceMapJsLibCount).isEqualTo(jsonJsLibCount);

        List<Object> contextResources = getResourceListByType(resourceMap, GitResourceType.CONTEXT_CONFIG);
        long resourceMapContextCount = contextResources.size();
        int jsonContextCount = exchangeJson.getContextList() != null
                ? exchangeJson.getContextList().size()
                : 0;
        assertThat(resourceMapContextCount).isEqualTo(jsonContextCount);

        List<Object> jsObjectConfigResources = getResourceListByType(resourceMap, GitResourceType.JSOBJECT_CONFIG);
        long resourceMapJsObjectConfigCount = jsObjectConfigResources.size();
        int jsonJsObjectCount = exchangeJson.getActionCollectionList() != null
                ? exchangeJson.getActionCollectionList().size()
                : 0;
        assertThat(resourceMapJsObjectConfigCount).isEqualTo(jsonJsObjectCount);

        List<Object> jsObjectDataResources = getResourceListByType(resourceMap, GitResourceType.JSOBJECT_DATA);
        long resourceMapJsObjectDataCount = jsObjectDataResources.size();
        assertThat(resourceMapJsObjectDataCount).isEqualTo(jsonJsObjectCount);

        List<Object> actionConfigResources = getResourceListByType(resourceMap, GitResourceType.QUERY_CONFIG);
        long resourceMapActionConfigCount = actionConfigResources.size();
        int jsonActionCount = exchangeJson.getActionList() != null
                ? exchangeJson.getActionList().size()
                : 0;
        assertThat(resourceMapActionConfigCount).isEqualTo(jsonActionCount);

        List<Object> actionDataResources = getResourceListByType(resourceMap, GitResourceType.QUERY_DATA);
        long resourceMapActionDataCount = actionDataResources.size();
        long jsonActionDataCount = 0;
        if (exchangeJson.getActionList() != null) {
            jsonActionDataCount = exchangeJson.getActionList().stream()
                    .filter(action -> !PluginType.JS.equals(action.getPluginType()))
                    .count();
        }
        assertThat(resourceMapActionDataCount).isEqualTo(jsonActionDataCount);

        List<Object> widgetResources = getResourceListByType(resourceMap, GitResourceType.WIDGET_CONFIG);

        return resourceMapDatasourceCount
                + resourceMapRootCount
                + resourceMapJsLibCount
                + resourceMapContextCount
                + resourceMapJsObjectConfigCount
                + resourceMapJsObjectDataCount
                + resourceMapActionConfigCount
                + resourceMapActionDataCount
                + widgetResources.size();
    }

    protected List<Object> getResourceListByType(
            Map<GitResourceIdentity, Object> resourceMap, GitResourceType resourceType) {
        return resourceMap.entrySet().stream()
                .filter(entry -> {
                    GitResourceIdentity key = entry.getKey();

                    return resourceType.equals(key.getResourceType());
                })
                .map(Map.Entry::getValue)
                .collect(Collectors.toList());
    }
}
