package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ApiTemplate;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.TemplateCollection;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Datasource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class PostmanImporterService extends BaseApiImporter {
    @Override
    public Mono<Action> importAction(Object input, String pageId, String name) {
        Action action = new Action();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Datasource datasource = new Datasource();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        action.setDatasource(datasource);
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(pageId);
        action.setName(name);
        return Mono.just(action);
    }

    public TemplateCollection importPostmanCollection(Object input) {
        TemplateCollection templateCollection = createTemplateCollection("RandomCollectionIdAfterStoring");
        return templateCollection;
    }

    public List<TemplateCollection> fetchPostmanCollections() {
        TemplateCollection templateCollection = createTemplateCollection("RandomCollectionIdAfterStoring");

        List<TemplateCollection> templateCollectionList = new ArrayList<>();
        templateCollectionList.add(templateCollection);
        return templateCollectionList;
    }

    public TemplateCollection deletePostmanCollection(String id) {
        TemplateCollection templateCollection = createTemplateCollection(id);

        return templateCollection;
    }

    private ApiTemplate createApiTemplate() {
        ApiTemplate apiTemplate = new ApiTemplate();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("/viewSomething");
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        List<Property> headers = new ArrayList<>();
        Property header = new Property();
        header.setKey("key");
        header.setValue("value");
        headers.add(header);
        actionConfiguration.setHeaders(headers);

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://google.com");

        apiTemplate.setName("templateName");
        apiTemplate.setProviderId("providerId");
        apiTemplate.setPublisher("RapidApi");
        apiTemplate.setVersionId("VersionId");

        apiTemplate.setActionConfiguration(actionConfiguration);
        apiTemplate.setDatasourceConfiguration(datasourceConfiguration);
        apiTemplate.setPackageName("restapi-plugin");
        apiTemplate.setId("RandomIdAfterStoring");

        return apiTemplate;
    }

    private TemplateCollection createTemplateCollection(String id) {
        ApiTemplate apiTemplate = createApiTemplate();
        TemplateCollection templateCollection = new TemplateCollection();
        List<String> apiTemplateIds;
        apiTemplateIds = new ArrayList<>();
        List<ApiTemplate> apiTemplateList;
        apiTemplateList = new ArrayList<>();
        apiTemplateIds.add(apiTemplate.getId());
        apiTemplateList.add(apiTemplate);
        templateCollection.setApiTemplateIds(apiTemplateIds);
        templateCollection.setApiTemplateList(apiTemplateList);
        templateCollection.setId(id);

        return templateCollection;
    }

}
