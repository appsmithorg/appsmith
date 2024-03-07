package com.appsmith.server.helpers.ce.bridge;

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
import java.util.stream.Stream;

public class BridgeQuery<T extends BaseDomain> implements Specification<T> {
    final List<Check> checks = new ArrayList<>();

    protected BridgeQuery() {}

    @Override
    public Predicate toPredicate(
            @NonNull Root<T> root, @NonNull CriteriaQuery<?> ignored, @NonNull CriteriaBuilder cb) {
        final List<Predicate> predicates = new ArrayList<>();

        for (Check check : checks) {
            Predicate predicate;

            if (check instanceof Check.Unit unit) {
                var op = unit.op();
                var key = unit.key();
                var value = unit.value();

                if (Objects.requireNonNull(op) == Op.EQUAL) {
                    predicate = cb.equal(keyToExpression(String.class, root, cb, key), cb.literal(value));

                } else if (Objects.requireNonNull(op) == Op.NOT_EQUAL) {
                    predicate = cb.notEqual(root.get(key), cb.literal(value));

                } else if (op == Op.EQ_IGNORE_CASE) {
                    predicate = cb.equal(cb.lower(root.get(key)), cb.literal(((String) value).toLowerCase()));

                } else if (op == Op.IS_TRUE) {
                    if (key.contains(".")) {
                        predicate = cb.equal(
                                keyToExpression(Object.class, root, cb, key),
                                cb.function("jsonb", Object.class, cb.literal("true")));
                    } else {
                        predicate = cb.isTrue(keyToExpression(Boolean.class, root, cb, key));
                    }

                } else if (op == Op.IS_FALSE) {
                    if (key.contains(".")) {
                        predicate = cb.equal(
                                keyToExpression(Object.class, root, cb, key),
                                cb.function("jsonb", Object.class, cb.literal("false")));
                    } else {
                        predicate = cb.isFalse(keyToExpression(Boolean.class, root, cb, key));
                    }

                } else if (op == Op.IS_NULL) {
                    predicate = cb.isNull(keyToExpression(String.class, root, cb, key));

                } else if (op == Op.IN) {
                    final CriteriaBuilder.In<Object> inCluse = cb.in(keyToExpression(String.class, root, cb, key));
                    for (Object item : (Collection<?>) value) {
                        inCluse.value(item);
                    }
                    predicate = inCluse;

                } else if (op == Op.EXISTS) {
                    if (key.contains(".")) {
                        predicate = cb.isTrue(keyToExpressionExists(root, cb, key));
                    } else {
                        predicate = cb.isNotNull(keyToExpression(Object.class, root, cb, key));
                    }

                } else if (op == Op.JSON_IN) {
                    predicate = cb.isTrue(cb.function(
                            "jsonb_path_exists",
                            Boolean.class,
                            root.get(key),
                            cb.literal("$[*] ? (@ == \"" + value + "\")")));

                } else {
                    throw new IllegalArgumentException();
                }

            } else if (check instanceof Check.Or<? extends BaseDomain> orCheck) {
                predicate = cb.or(Stream.of(((Check.Or<T>) orCheck).items())
                        .map(s -> s.toPredicate(root, ignored, cb))
                        .toArray(Predicate[]::new));

            } else if (check instanceof Check.And<? extends BaseDomain> orCheck) {
                predicate = cb.and(Stream.of(((Check.And<T>) orCheck).items())
                        .map(s -> s.toPredicate(root, ignored, cb))
                        .toArray(Predicate[]::new));

            } else {
                throw new IllegalArgumentException();
            }

            predicates.add(predicate);
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    }

    public BridgeQuery<T> equal(@NonNull String key, @NonNull String value) {
        checks.add(new Check.Unit(Op.EQUAL, key, value));
        return this;
    }

    public BridgeQuery<T> notEqual(@NonNull String key, @NonNull String value) {
        checks.add(new Check.Unit(Op.NOT_EQUAL, key, value));
        return this;
    }

    public BridgeQuery<T> eqIgnoreCase(String key, String value) {
        checks.add(new Check.Unit(Op.EQ_IGNORE_CASE, key, value));
        return this;
    }

    public BridgeQuery<T> isNull(String field) {
        checks.add(new Check.Unit(Op.IS_NULL, field, null));
        return this;
    }

    public BridgeQuery<T> isTrue(String field) {
        checks.add(new Check.Unit(Op.IS_TRUE, field, null));
        return this;
    }

    public BridgeQuery<T> isFalse(String field) {
        checks.add(new Check.Unit(Op.IS_FALSE, field, null));
        return this;
    }

    public BridgeQuery<T> in(@NonNull String needle, @NonNull Collection<String> haystack) {
        checks.add(new Check.Unit(Op.IN, needle, haystack));
        return this;
    }

    public BridgeQuery<T> exists(String key) {
        checks.add(new Check.Unit(Op.EXISTS, key, null));
        return this;
    }

    /**
     * Check that the string `needle` is present in the JSON array at `key`.
     */
    public BridgeQuery<T> jsonIn(@NonNull String needle, @NonNull String key) {
        checks.add(new Check.Unit(Op.JSON_IN, key, needle));
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

    private static Expression<Boolean> keyToExpressionExists(
            @NonNull Root<?> root, @NonNull CriteriaBuilder cb, @NonNull String key) {
        if (key.contains(".")) {
            final List<String> parts = List.of(key.split("\\."));

            final List<Expression<?>> fnArgs = new ArrayList<>();
            fnArgs.add(root.get(parts.get(0)));

            return cb.function(
                    "jsonb_path_exists",
                    Boolean.class,
                    root.get(parts.get(0)),
                    cb.literal("$." + String.join(".", parts.subList(1, parts.size()))));
        }

        return root.get(key);
    }
}
