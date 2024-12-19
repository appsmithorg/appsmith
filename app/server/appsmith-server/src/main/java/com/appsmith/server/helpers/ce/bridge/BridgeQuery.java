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

public class BridgeQuery<T extends BaseDomain> implements Specification<T> {
    final List<Check> checks = new ArrayList<>();
    final List<BridgeQuery<T>> ands = new ArrayList<>();

    protected BridgeQuery() {}

    @Override
    public Predicate toPredicate(@NonNull Root<T> root, @NonNull CriteriaQuery<?> cq, @NonNull CriteriaBuilder cb) {
        final List<Predicate> predicates = new ArrayList<>();

        for (Check check : checks) {
            Predicate predicate;

            if (check instanceof Check.Unit unit) {
                var op = unit.op();
                var key = unit.key();
                var value = unit.value();

                if (Objects.requireNonNull(op) == Op.EQUAL) {
                    final Expression<String> field = keyToExpression(String.class, root, cb, key);
                    // In Postgres `null = 1` is `null`, not `false`. But we want our `equal` operation to result in
                    // `false` in that case. So we need the extra "null check" here.
                    // We're relying on the fact that the `.equal` method has `@NonNull` on the value, so it can never
                    // be null.
                    predicate = cb.and(cb.isNotNull(field), cb.equal(field, cb.literal(value)));

                } else if (Objects.requireNonNull(op) == Op.NOT_EQUAL) {
                    final Expression<String> field = keyToExpression(String.class, root, cb, key);
                    // In Postgres `null != 1` is `null`, not `false`. But we want our `notEqual` operation to result in
                    // `false` in that case. So we need the extra "null check" here.
                    // We're relying on the fact that the `.notEqual` method has `@NonNull` on the value, so it can
                    // never be null.
                    predicate = cb.or(cb.isNull(field), cb.notEqual(field, cb.literal(value)));

                } else if (op == Op.EQ_IGNORE_CASE) {
                    predicate = cb.equal(cb.lower(root.get(key)), cb.literal(((String) value).toLowerCase()));

                } else if (op == Op.SEARCH_IGNORE_CASE) {
                    // TODO(Shri): Use `ilike` here with a custom function.
                    final String escapedNeedle = ((String) value).toLowerCase().replaceAll("[_%]", "\\\\$0");
                    predicate = cb.like(cb.lower(root.get(key)), cb.literal("%" + escapedNeedle + "%"), '\\');

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

                } else if (op == Op.IS_NOT_NULL) {
                    predicate = cb.isNotNull(keyToExpression(String.class, root, cb, key));

                } else if (op == Op.IN) {
                    predicate = keyToExpression(String.class, root, cb, key).in((Collection) value);

                } else if (op == Op.NOT_IN) {
                    predicate = keyToExpression(String.class, root, cb, key)
                            .in((Collection) value)
                            .not();

                } else if (op == Op.EXISTS) {
                    if (key.contains(".")) {
                        predicate = cb.isTrue(keyToExpressionExists(root, cb, key));
                    } else {
                        predicate = cb.isNotNull(keyToExpression(Object.class, root, cb, key));
                    }

                } else if (op == Op.NOT_EXISTS) {
                    if (key.contains(".")) {
                        predicate = cb.isFalse(keyToExpressionExists(root, cb, key));
                    } else {
                        predicate = cb.isNull(keyToExpression(Object.class, root, cb, key));
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
                predicate = cb.or(((Check.Or<T>) orCheck)
                        .items().stream().map(s -> s.toPredicate(root, cq, cb)).toArray(Predicate[]::new));

            } else if (check instanceof Check.And<? extends BaseDomain> andCheck) {
                predicate = cb.and(((Check.And<T>) andCheck)
                        .items().stream().map(s -> s.toPredicate(root, cq, cb)).toArray(Predicate[]::new));

            } else {
                throw new IllegalArgumentException();
            }

            predicates.add(predicate);
        }

        for (BridgeQuery<T> and : ands) {
            predicates.add(and.toPredicate(root, cq, cb));
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    }

    public BridgeQuery<T> equal(@NonNull String key, @NonNull String value) {
        checks.add(new Check.Unit(Op.EQUAL, key, value));
        return this;
    }

    public BridgeQuery<T> equal(@NonNull String key, int value) {
        checks.add(new Check.Unit(Op.EQUAL, key, value));
        return this;
    }

    public BridgeQuery<T> notEqual(@NonNull String key, @NonNull String value) {
        checks.add(new Check.Unit(Op.NOT_EQUAL, key, value));
        return this;
    }

    public BridgeQuery<T> equal(@NonNull String key, @NonNull Enum<?> value) {
        return equal(key, value.name());
    }

    public BridgeQuery<T> notEqual(@NonNull String key, @NonNull Enum<?> value) {
        return notEqual(key, value.name());
    }

    public BridgeQuery<T> equalIgnoreCase(String key, String value) {
        checks.add(new Check.Unit(Op.EQ_IGNORE_CASE, key, value));
        return this;
    }

    public BridgeQuery<T> searchIgnoreCase(@NonNull String key, @NonNull String needle) {
        if (key.contains(".")) {
            throw new UnsupportedOperationException("Search-ignore-case is not supported for nested fields");
        }

        checks.add(new Check.Unit(Op.SEARCH_IGNORE_CASE, key, needle));
        return this;
    }

    public BridgeQuery<T> in(@NonNull String needle, @NonNull Collection<String> haystack) {
        checks.add(new Check.Unit(Op.IN, needle, haystack));
        return this;
    }

    // Filtering for enums does not work with hibernate even if the field is annotated with @Enumerated(String.class)
    public BridgeQuery<T> in(@NonNull String needle, @NonNull List<Enum<?>> haystack) {
        checks.add(new Check.Unit(Op.IN, needle, haystack));
        return this;
    }

    public BridgeQuery<T> notIn(@NonNull String needle, @NonNull Collection<String> haystack) {
        checks.add(new Check.Unit(Op.NOT_IN, needle, haystack));
        return this;
    }

    // Filtering for enums does not work with hibernate even if the field is annotated with @Enumerated(String.class)
    public BridgeQuery<T> enumNotIn(@NonNull String key, @NonNull Collection<Enum<?>> value) {
        checks.add(new Check.Unit(Op.NOT_IN, key, value));
        return this;
    }

    public BridgeQuery<T> exists(String key) {
        checks.add(new Check.Unit(Op.EXISTS, key, null));
        return this;
    }

    public BridgeQuery<T> notExists(String key) {
        checks.add(new Check.Unit(Op.NOT_EXISTS, key, null));
        return this;
    }

    public BridgeQuery<T> isNull(String field) {
        checks.add(new Check.Unit(Op.IS_NULL, field, null));
        return this;
    }

    public BridgeQuery<T> isNotNull(String field) {
        checks.add(new Check.Unit(Op.IS_NOT_NULL, field, null));
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

    public final BridgeQuery<T> and(BridgeQuery<T> item) {
        ands.add(item);
        return this;
    }

    /**
     * Check that the string `needle` is present in the JSON array at `key`.
     */
    public BridgeQuery<T> jsonIn(@NonNull String needle, @NonNull String key) {
        checks.add(new Check.Unit(Op.JSON_IN, key, needle));
        return this;
    }

    public static <R> Expression<R> keyToExpression(
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
