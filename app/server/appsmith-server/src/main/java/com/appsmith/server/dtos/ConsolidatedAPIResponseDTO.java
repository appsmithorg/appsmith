package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.Theme;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class ConsolidatedAPIResponseDTO {
    UserProfileDTO v1UsersMeResp;
    Map<String, Boolean> v1UsersFeaturesResp;
    Tenant v1TenantsCurrentResp;
    ProductAlertResponseDTO v1ProductAlertResp;
    ApplicationPagesDTO v1PagesResp;
    List<ActionViewDTO> v1ActionsViewResp;
    List<ActionDTO> v1ActionsResp;
    List<ActionCollectionViewDTO> v1CollectionsActionsViewResp;
    List<ActionCollectionDTO> v1CollectionsActionsResp;
    Theme v1ThemesApplicationCurrentModeResp;
    List<Theme> v1ThemesResp;
    PageDTO v1PublishedPageResp;
    PageDTO v1PageResp;
    List<PageDTO> v1PageDSLs;
    List<CustomJSLib> v1LibrariesApplicationResp;
    List<Plugin> v1PluginsResp;
    List<Datasource> v1DatasourcesResp;
    Map<String, Map> v1PluginFormConfigsResp;
    List<MockDataSet> v1DatasourcesMockResp;
}
