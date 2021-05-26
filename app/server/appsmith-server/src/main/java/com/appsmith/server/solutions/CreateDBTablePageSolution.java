package com.appsmith.server.solutions;

import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Column;
import com.appsmith.external.models.DatasourceStructure.Table;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.NewPageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class CreateDBTablePageSolution {
    
    private DatasourceStructureSolution datasourceStructureSolution;
    
    private NewPageService newPageService;
    
    private ApplicationService applicationService;
    
    private ApplicationPageService applicationPageService;
    
    private ConfigService configService;
    
    private String templateDBName = "mock-DB-to-create-CRUD-page";
    
    private String templateApplicationName = "template-CRUD-DB-table-app";
    
    private static String DATABASE_TABLE = "database table";
    
    public PageDTO createPageFromDBTable(String appId, String datasourceId, String tableName) {
        
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
                AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId))
            )
            .flatMap(datasourceStructure -> {
                Table table = datasourceStructure.getTables()
                    .stream()
                    .filter(t -> StringUtils.equals(tableName, t.getName()))
                    .findFirst()
                    .orElse(null);
                
                if (table == null) {
                    return Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, DATABASE_TABLE, tableName));
                }
                return Mono.zip(
                    Mono.just(table),
                    templateDSStructureMono,
                    templatePageMono
                );
            })
            .map(tuple -> {
                Table table = tuple.getT1();
                //We are expecting only one table will be present
                Table templateTable = tuple.getT2().getTables().get(0);
                NewPage templatePage = tuple.getT3();
                Map<String, String> mappedColumns = mapTableColumnNames(templateTable, table);
                
            });
    }
    
    private Map<String, String> mapTableColumnNames(Table sourceTable, Table destTable) {
        
        Map<Column, Column> mappedTableColumns = new HashMap<>();
        
        return mappedTableColumns;
    }
}
