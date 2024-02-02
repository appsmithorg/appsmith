package com.appsmith.server.helpers;

public class CriteriaSpecBridge {

    private String lastWhere;

    public static CriteriaSpecBridge where(String key) {
        final CriteriaSpecBridge bridge = new CriteriaSpecBridge();
        bridge.lastWhere = key;
        return bridge;
    }
}
