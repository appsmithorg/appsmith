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

/**
 * This class serves as a DTO for the response data returned via the consolidated API endpoint call
 * (v1/consolidated-api) . Each identifier in the class represents the data returned from a unique endpoint. The
 * endpoint info is mentioned on top of each identifier.
 */
@Getter
@Setter
public class ConsolidatedAPIResponseDTO {
    /* v1/users/me */
    ResponseDTO<UserProfileDTO> v1UsersMeResp;

    /* v1/users/features */
    ResponseDTO<Map<String, Boolean>> v1UsersFeaturesResp;

    /* v1/tenants/current */
    ResponseDTO<Tenant> v1TenantsCurrentResp;

    /* v1/product-alert/alert */
    ResponseDTO<ProductAlertResponseDTO> v1ProductAlertResp;

    /* v1/pages */
    ResponseDTO<ApplicationPagesDTO> v1PagesResp;

    /* v1/actions/view */
    ResponseDTO<List<ActionViewDTO>> v1ActionsViewResp;

    /* v1/actions */
    ResponseDTO<List<ActionDTO>> v1ActionsResp;

    /* v1/collections/actions/view */
    ResponseDTO<List<ActionCollectionViewDTO>> v1CollectionsActionsViewResp;

    /* v1/collections/actions */
    ResponseDTO<List<ActionCollectionDTO>> v1CollectionsActionsResp;

    /* v1/themes/applications/{applicationId}/current */
    ResponseDTO<Theme> v1ThemesApplicationCurrentModeResp;

    /* v1/themes/applications/{applicationId} */
    ResponseDTO<List<Theme>> v1ThemesResp;

    /* v1/pages/{pageId}/view */
    ResponseDTO<PageDTO> v1PublishedPageResp;

    /* v1/pages/{pageId} */
    ResponseDTO<PageDTO> v1PageResp;

    /* v1/pages/{pageId} - for all pages */
    ResponseDTO<List<PageDTO>> v1PageDSLs;

    /* v1/libraries/{applicationId}/view */
    ResponseDTO<List<CustomJSLib>> v1LibrariesApplicationResp;

    /* v1/plugins */
    ResponseDTO<List<Plugin>> v1PluginsResp;

    /* v1/datasources */
    ResponseDTO<List<Datasource>> v1DatasourcesResp;

    /* v1/plugins/{pluginId}/form - for all plugins used in app */
    ResponseDTO<Map<String, Map>> v1PluginFormConfigsResp;

    /* v1/datasources/mock */
    ResponseDTO<List<MockDataSet>> v1DatasourcesMockResp;
}
