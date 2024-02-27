package com.appsmith.server.helpers.ce.bridge;

import lombok.NonNull;
import org.bson.Document;
import org.bson.types.ObjectId;
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

    public Bridge equal(@NonNull String key, @NonNull ObjectId value) {
        criteriaList.add(Criteria.where(key).is(value));
        return this;
    }

    public Bridge exists(@NonNull String key) {
        criteriaList.add(Criteria.where(key).exists(true));
        return this;
    }

    public Bridge isTrue(@NonNull String key) {
        criteriaList.add(Criteria.where(key).is(true));
        return this;
    }

    /**
     * Explicitly disable the `where()` API to prevent its usage. This is because querying with this API will work here,
     * but won't work in the Postgres version.
     */
    public static Bridge where() {
        throw new UnsupportedOperationException("Not implemented");
    }

    @Override
    public Document getCriteriaObject() {
        if (criteriaList.isEmpty()) {
            throw new UnsupportedOperationException(
                    "Empty bridge criteria leads to subtle bugs. Just don't call `.criteria()` in such cases.");
        }

        return new Criteria().andOperator(criteriaList.toArray(new Criteria[0])).getCriteriaObject();
    }
}
