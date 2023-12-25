package com.appsmith.server.dtos;

import com.appsmith.server.domains.CustomJSLib;
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
    List<ActionCollectionViewDTO> v1CollectionsActionsViewResp;
    Theme v1ThemesApplicationCurrentModeResp;
    List<Theme> v1ThemesResp;
    PageDTO v1PublishedPageResp;
    List<CustomJSLib> v1LibrariesApplicationResp;
}
