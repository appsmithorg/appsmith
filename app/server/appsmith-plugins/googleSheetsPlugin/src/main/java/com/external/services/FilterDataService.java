package com.external.services;

import org.springframework.stereotype.Component;

@Component
public class FilterDataService extends GoogleSheetFilterDataService  {

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

