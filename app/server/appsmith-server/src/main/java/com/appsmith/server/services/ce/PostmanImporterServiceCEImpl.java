package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ApiTemplate;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.TemplateCollection;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.BaseApiImporter;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Slf4j
public class PostmanImporterServiceCEImpl extends BaseApiImporter implements PostmanImporterServiceCE {

    private final NewPageService newPageService;
    private final ResponseUtils responseUtils;
    private final PagePermission pagePermission;

    public PostmanImporterServiceCEImpl(
            NewPageService newPageService, ResponseUtils responseUtils, PagePermission pagePermission) {
        this.newPageService = newPageService;
        this.responseUtils = responseUtils;
        this.pagePermission = pagePermission;
    }

    @Override
    public Mono<ActionDTO> importAction(
            Object input, String pageId, String name, String workspaceId, String branchName) {
        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Datasource datasource = new Datasource();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        action.setDatasource(datasource);
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(pageId);
        action.setName(name);
        return newPageService
                .findByBranchNameAndDefaultPageId(branchName, pageId, pagePermission.getActionCreatePermission())
                .map(branchedPage -> {
                    action.setDefaultResources(branchedPage.getDefaultResources());
                    return action;
                })
                .map(responseUtils::updateActionDTOWithDefaultResources);
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
