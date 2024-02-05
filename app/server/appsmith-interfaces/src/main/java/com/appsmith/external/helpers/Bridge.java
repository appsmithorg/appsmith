package com.appsmith.external.helpers;

import org.springframework.data.mongodb.core.query.Criteria;

import java.util.ArrayList;
import java.util.List;

public class Bridge extends Criteria {

    private String lastWhere;

    private List<Criteria> criteria = new ArrayList<>();

    private Bridge() {}

    public static Bridge where(String key) {
        final Bridge bridge = new Bridge();
        bridge.lastWhere = key;
        return bridge;
    }

    public Bridge is(String value) {
        if (lastWhere == null) {
            throw new IllegalStateException("You must call where()/and() before calling is()");
        }
        criteria.add(Criteria.where(lastWhere).is(value));
        return this;
    }

    public Bridge and(String key) {
        if (criteria.isEmpty()) {
            throw new IllegalStateException("You must call where().is() before calling and()");
        }
        lastWhere = key;
        return this;
    }

    public static List<Criteria> allOf(Bridge defaultAppCriteria, Bridge branchNameCriteria) {
        return null;
    }
}
