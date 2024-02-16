package com.appsmith.server.helpers.ce.bridge;

import lombok.NonNull;
import org.bson.Document;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.ArrayList;
import java.util.List;

public class Bridge extends Criteria {
    private final List<Criteria> criteriaList = new ArrayList<>();

    private Bridge() {}

    public static Bridge bridge() {
        return new Bridge();
    }

    public Bridge equal(@NonNull String key, @NonNull String value) {
        criteriaList.add(Criteria.where(key).is(value));
        return this;
    }

    @Override
    public Document getCriteriaObject() {
        return new Criteria().andOperator(criteriaList.toArray(new Criteria[0])).getCriteriaObject();
    }
}
