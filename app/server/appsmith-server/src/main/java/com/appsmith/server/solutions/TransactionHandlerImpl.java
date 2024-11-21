package com.appsmith.server.solutions;

import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.ThemeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Component
@Slf4j
public class TransactionHandlerImpl extends TransactionHandlerCEImpl implements TransactionHandler {

    public TransactionHandlerImpl(
            DatasourceRepository datasourceRepository,
            DatasourceStorageRepository datasourceStorageRepository,
            CustomJSLibRepository customJSLibRepository,
            ThemeRepository themeRepository,
            ApplicationRepository applicationRepository,
            NewPageRepository newPageRepository,
            NewActionRepository newActionRepository,
            ActionCollectionRepository actionCollectionRepository,
            TransactionTemplate transactionTemplate) {
        super(
                datasourceRepository,
                datasourceStorageRepository,
                customJSLibRepository,
                themeRepository,
                applicationRepository,
                newPageRepository,
                newActionRepository,
                actionCollectionRepository,
                transactionTemplate);
    }
}
