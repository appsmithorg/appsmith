package com.appsmith.server.helpers.bridge;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.NonNull;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

public class Conditioner<T extends BaseDomain> implements Specification<T> {
    private final List<Check> checks = new ArrayList<>();

    public enum Op {
        EQ,
        EQ_IGNORE_CASE,
        IS_TRUE,
        IN,
    }

    public record Check(Op op, String key, Object value) {}

    @Override
    public Predicate toPredicate(@NonNull Root<T> root, @NonNull CriteriaQuery<?> cq, @NonNull CriteriaBuilder cb) {
        final List<Predicate> predicates = new ArrayList<>();

        for (Check check : checks) {
            Predicate predicate;

            if (Objects.requireNonNull(check.op) == Op.EQ) {
                predicate = cb.equal(root.get(check.key), cb.literal(check.value));

            } else if (check.op == Op.EQ_IGNORE_CASE) {
                predicate = cb.equal(cb.lower(root.get(check.key)), cb.literal(((String) check.value).toLowerCase()));

            } else if (check.op == Op.IS_TRUE) {
                predicate = cb.isTrue(root.get(check.key));

            } else if (check.op == Op.IN) {
                CriteriaBuilder.In<Object> inCluse = cb.in(root.get(check.key));
                for (String value : (Collection<String>) check.value) {
                    inCluse.value(value);
                }
                predicate = inCluse;

            } else {
                throw new IllegalArgumentException();
            }

            predicates.add(predicate);
        }

        return cb.and(predicates.toArray(new Predicate[0]));
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

    public Conditioner<T> in(String needle, Collection<String> haystack) {
        checks.add(new Check(Op.IN, needle, haystack));
        return this;
    }
}
