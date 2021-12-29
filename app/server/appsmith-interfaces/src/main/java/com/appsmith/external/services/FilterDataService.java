package com.appsmith.external.services;

import com.appsmith.external.services.ce.FilterDataServiceCE;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class FilterDataService extends FilterDataServiceCE implements IFilterDataService {

    private static FilterDataService instance = null;

    private FilterDataService() {
        super();
    }

    public static FilterDataService getInstance() {

        if (instance == null) {
            instance = new FilterDataService();
        }

        return instance;
    }

}

