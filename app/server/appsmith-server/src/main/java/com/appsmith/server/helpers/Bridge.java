package com.appsmith.server.helpers;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.NonNull;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

public class Bridge<T extends BaseDomain> implements Specification<T> {

    private String lastWhere;

    private final List<Specification<T>> specs = new ArrayList<>();

    private Bridge() {}

    public static <T extends BaseDomain> Bridge<T> where(String key) {
        final Bridge<T> bridge = new Bridge<>();
        bridge.lastWhere = key;
        return bridge;
    }

    public Bridge<T> is(String value) {
        Objects.requireNonNull(lastWhere, "You must call where() before calling is()");
        final String finalLastWhere = lastWhere;
        specs.add((root, query, cb) -> cb.equal(root.get(finalLastWhere), value));
        lastWhere = null;
        return this;
    }

    public Bridge<T> and(String key) {
        lastWhere = key;
        return this;
    }

    @Override
    public Predicate toPredicate(
            @NonNull Root<T> root, @NonNull CriteriaQuery<?> query, @NonNull CriteriaBuilder criteriaBuilder) {
        return Specification.allOf(specs).toPredicate(root, query, criteriaBuilder);
    }

    public static <T> Specification<T> allOf(Iterable<Specification<T>> specifications) {
        return Specification.allOf(specifications);
    }

    @SafeVarargs
    public static <T> Specification<T> allOf(Specification<T>... specifications) {
        return allOf((Iterable) Arrays.asList(specifications));
    }
}
