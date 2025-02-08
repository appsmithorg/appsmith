package com.appsmith.server.git.resourcemap.templates.providers.ce;

import com.appsmith.external.git.models.GitResourceIdentity;
import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
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
        ExchangeJsonContext context = new ExchangeJsonContext("valid-application.json", ApplicationJson.class, 22);
        return Stream.of(context);
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
        int jsonJsObjectDataCount = exchangeJson.getActionCollectionList() != null
                ? exchangeJson.getActionCollectionList().parallelStream()
                        .filter(collection ->
                                collection.getUnpublishedCollection().getBody() != null)
                        .collect(Collectors.toList())
                        .size()
                : 0;
        assertThat(resourceMapJsObjectDataCount).isEqualTo(jsonJsObjectDataCount);

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
                    .filter(action -> !PluginType.JS.equals(action.getPluginType())
                            && action.getUnpublishedAction().getActionConfiguration() != null
                            && !(action.getUnpublishedAction()
                                                    .getActionConfiguration()
                                                    .getBody()
                                            == null
                                    || (action.getPluginType().equals(PluginType.REMOTE)
                                            && action.getUnpublishedAction()
                                                            .getActionConfiguration()
                                                            .getFormData()
                                                    == null)))
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

    public void assertResourceComparisons(
            ArtifactExchangeJson originalExchangeJson, ArtifactExchangeJson convertedExchangeJson) {
        List<DatasourceStorage> datasourceResources = convertedExchangeJson.getDatasourceList();
        long convertedDatasourceCount = datasourceResources.size();
        int jsonDatasourceCount = originalExchangeJson.getDatasourceList() != null
                ? originalExchangeJson.getDatasourceList().size()
                : 0;
        assertThat(convertedDatasourceCount).isEqualTo(jsonDatasourceCount);

        List<CustomJSLib> jsLibResources = convertedExchangeJson.getCustomJSLibList();
        long convertedJsLibCount = jsLibResources.size();
        int jsonJsLibCount = originalExchangeJson.getCustomJSLibList() != null
                ? originalExchangeJson.getCustomJSLibList().size()
                : 0;
        assertThat(convertedJsLibCount).isEqualTo(jsonJsLibCount);

        List<? extends Context> contextResources = convertedExchangeJson.getContextList();
        long convertedContextCount = contextResources.size();
        int jsonContextCount = originalExchangeJson.getContextList() != null
                ? originalExchangeJson.getContextList().size()
                : 0;
        assertThat(convertedContextCount).isEqualTo(jsonContextCount);

        List<ActionCollection> jsObjectResources = convertedExchangeJson.getActionCollectionList();
        long convertedJsObjectCount = jsObjectResources.size();
        int jsonJsObjectCount = originalExchangeJson.getActionCollectionList() != null
                ? originalExchangeJson.getActionCollectionList().size()
                : 0;
        assertThat(convertedJsObjectCount).isEqualTo(jsonJsObjectCount);

        List<NewAction> actionResources = convertedExchangeJson.getActionList();
        long convertedActionCount = actionResources.size();
        int jsonActionCount = originalExchangeJson.getActionList() != null
                ? originalExchangeJson.getActionList().size()
                : 0;
        assertThat(convertedActionCount).isEqualTo(jsonActionCount);
    }
}
