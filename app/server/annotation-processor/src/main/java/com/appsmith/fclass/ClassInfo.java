package com.appsmith.fclass;

import javax.lang.model.element.Element;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public record ClassInfo(String packageName, String className) {
    private static final Pattern PATTERN =
            Pattern.compile("(?<package>[a-z]+(\\.[a-z]+)*).*\\.(?<className>[A-Z]\\w+)");

    public static ClassInfo of(Element el) {
        final Matcher matcher = PATTERN.matcher(el.toString());
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Invalid class element: " + el);
        }
        return new ClassInfo(matcher.group("package"), matcher.group("className"));
    }
}
