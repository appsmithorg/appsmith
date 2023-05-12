package com.appsmith.server.helpers;

import com.appsmith.external.models.Datasource;

import java.util.HashMap;
import java.util.Map;

public class AnalyticsUtils {

    public static Map<String,String> getAnalyticsProperties(Datasource datasource){
        Map<String,String> properties = new HashMap<>();
        properties.put("dsId",datasource.getId());
        properties.put("pluginId",datasource.getPluginId());
        return properties;
    }

    public static Map<String,String> getAnalyticsPropertiesForFailEvent(Datasource datasource,Throwable e){
        Map<String,String> properties = new HashMap<>();
        properties.put("dsId",datasource.getId());
        properties.put("pluginId",datasource.getPluginId());
        properties.put("errorMessage",e.getMessage());
        return properties;
    }
}
