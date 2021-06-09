package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Column;
import com.appsmith.external.models.DatasourceStructure.Table;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PluginService;
import com.sun.mail.imap.ACL;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.security.acl.Acl;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@NoArgsConstructor
@Slf4j
public class    CreateDBTablePageSolution {
    
    private DatasourceStructureSolution datasourceStructureSolution;
    
    private DatasourceService datasourceService;
    
    private PluginService pluginService;
    
    private NewPageService newPageService;
    
    private ApplicationService applicationService;
    
    private ApplicationPageService applicationPageService;
    
    private ConfigService configService;
    
    private LayoutActionService layoutActionService;
    
    private String templateDBName = "mock-DB-to-create-CRUD-page";
    
    private String templateApplicationName = "template-CRUD-DB-table-app";
    
    private final String DATABASE_TABLE = "database table";
    
    private enum DBActionType {
        CREATE, READ, SELECT, UPDATE, DELETE
    }
    
    public PageDTO createPageFromDBTable(String appId, String pageId, String datasourceId, String tableName) {
        
        Mono<DatasourceStructure> templateDSStructureMono = configService.getTemplateDatasources()
            .filter(datasource -> StringUtils.equals(datasource.getName(), templateDBName))
            .next()
            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE)))
            .map(datasource -> datasource.getStructure())
            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE_STRUCTURE, templateDBName)));
        
        Mono<NewPage> templatePageMono = configService.getTemplateApplications()
            .filter(application -> StringUtils.equals(application.getName(), templateApplicationName))
            .next()
            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, templateApplicationName)))
            .flatMap(application -> {
                ApplicationPage defaultAppPage = application.getPages()
                    .stream()
                    .filter(ApplicationPage::isDefault)
                    .findFirst()
                    .orElse(null);
                
                return newPageService.getById(defaultAppPage.getId());
            });
        
        return datasourceStructureSolution.getStructure(datasourceId, true)
            .switchIfEmpty(Mono.error(new AppsmithException(
                AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.DATASOURCE_STRUCTURE, datasourceId))
            )
            .zipWith(datasourceService.findById(datasourceId, AclPermission.MANAGE_DATASOURCES)
                .switchIfEmpty(Mono.error(new AppsmithException(
                    AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId))
                )
            )
            .flatMap(tuple -> {
                DatasourceStructure datasourceStructure = tuple.getT1();
                Datasource currDatasource = tuple.getT2();
                
                Table currTable = datasourceStructure.getTables()
                    .stream()
                    .filter(t -> StringUtils.equals(tableName, t.getName()))
                    .findFirst()
                    .orElse(null);
                
                if (currTable == null) {
                    return Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, DATABASE_TABLE, tableName));
                }
                return Mono.zip(
                    Mono.just(currTable),
                    templateDSStructureMono,
                    templatePageMono
                );
            })
            .map(tuple -> {
                Table currTable = tuple.getT1();
                //We are expecting only one table will be present
                Table templateTable = tuple.getT2().getTables().get(0);
                NewPage templatePage = tuple.getT3();
                Map<String, Column> templateTableNameToColumnMap = new HashMap<>();
                Map<String, Column> currTableNameToColumnMap = new HashMap<>();
                List<Map<String, Column>> columnMapList = List.of(templateTableNameToColumnMap, currTableNameToColumnMap);
                Map<String, String> mappedColumns = mapTableColumnNames(templateTable, currTable, columnMapList);
                cloneAction()
            });
    }
    
    private Mono<ActionDTO> cloneAction(Datasource datasource, String pageId,
                                        ActionDTO templateAction, DBActionType actionType) {
        
        ActionDTO action = templateAction;
        action.setDatasource(datasource);
        action.setPageId(pageId);
        
        datasource.getStructure().getTables().get(0).getTemplates()
        
        return pluginService.findById(datasource.getPluginId())
            .map(plugin -> {
                String pluginPackageName = plugin.getPackageName();
                
            })
        
    }
    
    private Map<String, String> mapTableColumnNames(Table sourceTable, Table destTable, List<Map<String, Column>> columnMapList) {
        Map<String, String> mappedTableColumns = new HashMap<>();
        Map<String, Column> templateColumnMap = columnMapList.get(0);
        Map<String, Column> currTableColumnMap = columnMapList.get(1);
        List<Column> sourceTableColumns = sourceTable.getColumns(), destTableColumns = destTable.getColumns();
        
        int idx = 0;
        while (idx < sourceTableColumns.size() && idx < destTableColumns.size()) {
            
            templateColumnMap.put(sourceTableColumns.get(idx).getName(), sourceTableColumns.get(idx));
            currTableColumnMap.put(destTableColumns.get(idx).getName(), destTableColumns.get(idx));
            mappedTableColumns.put(sourceTableColumns.get(idx).getName(), destTableColumns.get(idx).getName());
            idx++;
        }
        
        if (idx < destTableColumns.size()) {
            while (idx < destTableColumns.size()) {
                currTableColumnMap.put(destTableColumns.get(idx).getName(), destTableColumns.get(idx));
                idx++;
            }
        }
        return mappedTableColumns;
    }
    
    private Map<String, String> mapKeys(Table sourceTable, Table destTable) {
    
    }
}


/*
String widgetType = dsl.getAsString(FieldName.WIDGET_TYPE);

// Only Table widget has this behaviour.
if (widgetType != null && widgetType.equals(FieldName.TABLE_WIDGET)) {
    return WidgetSpecificUtils.escapeTableWidgetPrimaryColumns(dsl, escapedWidgetNames);
}
 */