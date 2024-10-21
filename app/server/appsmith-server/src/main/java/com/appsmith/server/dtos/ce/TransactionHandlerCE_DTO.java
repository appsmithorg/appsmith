package com.appsmith.server.dtos.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class TransactionHandlerCE_DTO {
    List<Datasource> datasourceList = new ArrayList<>();

    List<DatasourceStorage> datasourceStorageList = new ArrayList<>();

    List<Theme> themeList = new ArrayList<>();

    List<NewPage> newPageList = new ArrayList<>();

    List<ActionCollection> actionCollectionList = new ArrayList<>();

    List<NewAction> actionList = new ArrayList<>();

    Application application = null;

    List<CustomJSLib> customJSLibList = new ArrayList<>();
}
