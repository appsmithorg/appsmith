package com.appsmith.server.helpers.bridge;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.NonNull;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class Conditioner<T extends BaseDomain> implements Specification<T> {
    private final List<Check> checks = new ArrayList<>();

    public enum Op {
        EQ,
        EQ_IGNORE_CASE,
        IS_TRUE,
    }

    @Override
    public Predicate toPredicate(@NonNull Root<T> root, @NonNull CriteriaQuery<?> cq, CriteriaBuilder cb) {
        final Predicate[] predicates = checks.stream()
                .map(check -> switch (check.op) {
                    case EQ -> cb.equal(root.get(check.key), check.value.toLowerCase());
                    case EQ_IGNORE_CASE -> cb.equal(cb.lower(root.get(check.key)), check.value.toLowerCase());
                    case IS_TRUE -> cb.isTrue(root.get(check.key));
                })
                .toArray(Predicate[]::new);

        return cb.and(predicates);
    }

    public Conditioner<T> eq(String key, String value) {
        checks.add(new Check(Op.EQ, key, value));
        return this;
    }

    public Conditioner<T> eqIgnoreCase(String key, String value) {
        checks.add(new Check(Op.EQ_IGNORE_CASE, key, value));
        return this;
    }

    public Conditioner<T> isTrue(String field) {
        checks.add(new Check(Op.IS_TRUE, field, null));
        return this;
    }

    public record Check(Op op, String key, String value) {}
}
