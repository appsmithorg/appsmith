package com.appsmith.server.dtos.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.MockDataSet;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.ProductAlertResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UserProfileDTO;
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
public class ConsolidatedAPIResponseCE_DTO {
    /* v1/users/me */
    ResponseDTO<UserProfileDTO> userProfile;

    /* v1/users/features */
    ResponseDTO<Map<String, Boolean>> featureFlags;

    /* v1/tenants/current */
    ResponseDTO<Organization> organizationConfig;

    /* v1/product-alert/alert */
    ResponseDTO<ProductAlertResponseDTO> productAlert;

    /* v1/pages */
    ResponseDTO<ApplicationPagesDTO> pages;

    /* v1/actions/view */
    ResponseDTO<List<ActionViewDTO>> publishedActions;

    /* v1/actions */
    ResponseDTO<List<ActionDTO>> unpublishedActions;

    /* v1/collections/actions/view */
    ResponseDTO<List<ActionCollectionViewDTO>> publishedActionCollections;

    /* v1/collections/actions */
    ResponseDTO<List<ActionCollectionDTO>> unpublishedActionCollections;

    /* v1/themes/applications/{applicationId}/current */
    ResponseDTO<Theme> currentTheme;

    /* v1/themes/applications/{applicationId} */
    ResponseDTO<List<Theme>> themes;

    /* v1/pages/{pageId}/view */
    ResponseDTO<PageDTO> pageWithMigratedDsl;

    /* v1/pages/{pageId} - for all pages */
    ResponseDTO<List<PageDTO>> pagesWithMigratedDsl;

    /* v1/libraries/{applicationId}/view */
    ResponseDTO<List<CustomJSLib>> customJSLibraries;

    /* v1/plugins */
    ResponseDTO<List<Plugin>> plugins;

    /* v1/datasources */
    ResponseDTO<List<Datasource>> datasources;

    /* v1/plugins/{pluginId}/form - for all plugins used in app */
    ResponseDTO<Map<String, Map<?, ?>>> pluginFormConfigs;

    /* v1/datasources/mock */
    ResponseDTO<List<MockDataSet>> mockDatasources;
}
