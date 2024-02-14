package com.appsmith.server.helpers.bridge;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
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
        EQUAL,
        NOT_EQUAL,
        EQ_IGNORE_CASE,
        IS_NULL,
        IS_TRUE,
        IN,
        JSON_IN,
    }

    public record Check(Op op, String key, Object value) {}

    @Override
    public Predicate toPredicate(
            @NonNull Root<T> root, @NonNull CriteriaQuery<?> ignored, @NonNull CriteriaBuilder cb) {
        final List<Predicate> predicates = new ArrayList<>();

        for (Check check : checks) {
            Predicate predicate;

            if (Objects.requireNonNull(check.op) == Op.EQUAL) {
                predicate = cb.equal(keyToExpression(String.class, root, cb, check.key), cb.literal(check.value));

            } else if (Objects.requireNonNull(check.op) == Op.NOT_EQUAL) {
                predicate = cb.notEqual(root.get(check.key), cb.literal(check.value));

            } else if (check.op == Op.EQ_IGNORE_CASE) {
                predicate = cb.equal(cb.lower(root.get(check.key)), cb.literal(((String) check.value).toLowerCase()));

            } else if (check.op == Op.IS_TRUE) {
                if (check.key.contains(".")) {
                    predicate = cb.equal(
                            keyToExpression(Object.class, root, cb, check.key),
                            cb.function("jsonb", Object.class, cb.literal("true")));
                } else {
                    predicate = cb.isTrue(keyToExpression(Boolean.class, root, cb, check.key));
                }

            } else if (check.op == Op.IS_NULL) {
                predicate = cb.isNull(keyToExpression(String.class, root, cb, check.key));

            } else if (check.op == Op.IN) {
                final CriteriaBuilder.In<Object> inCluse = cb.in(keyToExpression(String.class, root, cb, check.key));
                for (Object value : (Collection<?>) check.value) {
                    inCluse.value(value);
                }
                predicate = inCluse;

            } else if (check.op == Op.JSON_IN) {
                predicate = cb.isTrue(cb.function(
                        "jsonb_path_exists",
                        Boolean.class,
                        root.get(check.key),
                        cb.literal("$[*] ? (@ == \"" + check.value + "\")")));

            } else {
                throw new IllegalArgumentException();
            }

            predicates.add(predicate);
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    }

    public Conditioner<T> equal(@NonNull String key, @NonNull String value) {
        checks.add(new Check(Op.EQUAL, key, value));
        return this;
    }

    public Conditioner<T> notEqual(@NonNull String key, @NonNull String value) {
        checks.add(new Check(Op.NOT_EQUAL, key, value));
        return this;
    }

    public Conditioner<T> eqIgnoreCase(String key, String value) {
        checks.add(new Check(Op.EQ_IGNORE_CASE, key, value));
        return this;
    }

    public Conditioner<T> isNull(String field) {
        checks.add(new Check(Op.IS_NULL, field, null));
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

    private static <R> Expression<R> keyToExpression(
            @NonNull Class<R> type, @NonNull Root<?> root, @NonNull CriteriaBuilder cb, @NonNull String key) {
        if (key.contains(".")) {
            final List<String> parts = List.of(key.split("\\."));

            final List<Expression<?>> fnArgs = new ArrayList<>();
            fnArgs.add(root.get(parts.get(0)));

            for (final String nestedKey : parts.subList(1, parts.size())) {
                fnArgs.add(cb.literal(nestedKey));
            }

            return cb.function(
                    String.class.equals(type) ? "jsonb_extract_path_text" : "jsonb_extract_path",
                    type,
                    fnArgs.toArray(new Expression<?>[0]));
        }

        return root.get(key);
    }

    /**
     * Check that the string `needle` is present in the JSON array at `key`.
     */
    public Specification<T> jsonIn(String needle, String key) {
        checks.add(new Check(Op.JSON_IN, key, needle));
        return this;
    }
}
