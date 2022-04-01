package com.appsmith.external.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DynamicBinding;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeansException;
import org.springframework.beans.PropertyAccessorFactory;
import org.springframework.util.StringUtils;

import java.beans.PropertyDescriptor;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.getBeanPropertyValues;
import static com.appsmith.external.helpers.AppsmithBeanUtils.isDomainModel;
import static com.appsmith.external.helpers.SmartSubstitutionHelper.APPSMITH_SUBSTITUTION_PLACEHOLDER;

@Slf4j
public class MustacheHelper {

    /*
     * This pattern finds all the String which have been extracted from the mustache dynamic bindings.
     * e.g. for the given JS function using action with name "fetchUsers"
     * {{JSON.stringify(fetchUsers)}}
     * This pattern should return ["JSON.stringify", "fetchUsers"]
     */
    private final static Pattern pattern = Pattern.compile("[a-zA-Z_][a-zA-Z0-9._]*");
    /**
     * Appsmith smart replacement : The regex pattern below looks for '?' or "?". This pattern is later replaced with ?
     * to fit the requirements of prepared statements.
     */
    private static String regexQuotesTrimming = "([\"']\\?[\"'])";
    private static Pattern quoteQuestionPattern = Pattern.compile(regexQuotesTrimming);
    // The final replacement string of ? for replacing '?' or "?"
    private static String postQuoteTrimmingQuestionMark = "\\?";

    /**
     * Appsmith smart replacement with placeholder : The regex pattern below looks for `APPSMITH_SUBSTITUTION_PLACEHOLDER`
     * surrounded by quotes. This pattern is later replaced with just APPSMITH_SUBSTITUTION_PLACEHOLDER to fit the requirements
     * of JSON smart replacement aka trim the quotes present.
     */
    private static String regexPlaceholderTrimming = "([\"']" + APPSMITH_SUBSTITUTION_PLACEHOLDER + "[\"'])";
    private static Pattern placeholderTrimmingPattern = Pattern.compile(regexPlaceholderTrimming);

    private static String laxMustacheBindingRegex = "\\{\\{([\\s\\S]*?)\\}\\}";
    private static Pattern laxMustacheBindingPattern = Pattern.compile(laxMustacheBindingRegex);


    /**
     * Tokenize a Mustache template string into a list of plain text and Mustache interpolations.
     *
     * @param template String Mustache template string from which to extract plain text and interpolation tokens.
     * @return A list of String tokens, which form parts of the given template String. Joining the strings in this list
     * should give the original template back. The tokens are split such that alternative strings in the list are plain
     * text and the others are mustache interpolations.
     */
    public static List<String> tokenize(String template) {
        if (StringUtils.isEmpty(template)) {
            return Collections.emptyList();
        }

        List<String> tokens = new ArrayList<>();

        int length = template.length();

        // Following are state variables for the parser.
        // This indicates the state of the pointer. It is `true` when inside mustache double braces. Otherwise `false`.
        boolean isInsideMustache = false;

        // This is set to the quote character of a string in JS. When `null`, it means we're not inside any Javascript
        // string. Can only be one of null, double quote ("), single quote (') or back tick (`).
        Character quote = null;

        // Inside mustache JS, this is the current depth of open/close braces.
        int braceDepth = 0;

        StringBuilder currentToken = new StringBuilder().append(template.charAt(0));

        // The parser is implemented as a pointer (marked by `i`) that loops over each character in the template string.
        // There's majorly two states for the parser, plain-text-mode and mustache-mode, with the current state
        // indicated by `isInsideMustache`. This is set to `true` when the pointer encounters a `{{` in plain-text-mode.
        // It is set back to `false` when the pointer encounters a `}}` in mustache-mode, but not inside a quoted
        // string. Since the contents inside mustache double-braces is supposed to be valid Javascript expression, any
        // any braces inside quoted strings (using single, double or back quotes) should not affect the
        // `isInsideMustache` state.
        for (int i = 1; i < length; ++i) {
            char currentChar = template.charAt(i);
            char prevChar = template.charAt(i - 1);

            if (!isInsideMustache) {
                // Plain text.
                if (currentChar == '{' && prevChar == '{') {
                    isInsideMustache = true;
                    // Remove the `{` added to the builder.
                    currentToken.deleteCharAt(currentToken.length() - 1);
                    clearAndPushToken(currentToken, tokens);
                    currentToken.append(prevChar);
                    braceDepth = 2;
                }

                currentToken.append(currentChar);

            } else {
                // Javascript.
                if (quote != null) {
                    // We are inside a Javascript string.
                    if (currentChar == quote) {
                        // Count the backslashes before this quote and figure out if it is escaped.
                        int j = i;
                        do {
                            --j;
                        } while (template.charAt(j) == '\\');
                        int backslashCount = i - j - 1;
                        if (backslashCount % 2 == 0) {
                            // This quote character is not escaped, so it ends the quoted string.
                            quote = null;
                        }
                    }

                    currentToken.append(currentChar);

                } else if (currentChar == '"' || currentChar == '\'' || currentChar == '`') {
                    // This character starts a Javascript string.
                    quote = currentChar;
                    currentToken.append(currentChar);

                } else if (currentChar == '{') {
                    ++braceDepth;
                    currentToken.append(currentChar);

                } else if (currentChar == '}') {
                    --braceDepth;
                    currentToken.append(currentChar);
                    if (prevChar == '}' && braceDepth <= 0) {
                        clearAndPushToken(currentToken, tokens);
                        isInsideMustache = false;
                    }

                } else {
                    currentToken.append(currentChar);

                }

            }

        }

        if (currentToken.length() > 0) {
            tokens.add(currentToken.toString());
        }

        return tokens;
    }

    /**
     * Tokenize-s the given Mustache template string, extracts the Mustache interpolations out, strips the leading and
     * trailing double braces, trims and then returns a set of these replacement keys.
     *
     * @param template The Mustache input template string.
     * @return A Set of strings that serve as replacement keys, with the surrounding double braces stripped and then
     * trimmed.
     */
    public static Set<String> extractMustacheKeys(String template) {
        Set<String> keys = new HashSet<>();

        for (String token : tokenize(template)) {
            if (token.startsWith("{{") && token.endsWith("}}")) {
                // Allowing empty tokens to be added, to be compatible with the previous `extractMustacheKeys` method.
                // Calling `.trim()` before adding because Mustache compiler strips keys in the template before looking
                // up a value. Addresses https://www.notion.so/appsmith/Bindings-with-a-space-at-the-start-fail-to-execute-properly-in-the-API-pane-2eb65d5c6064466b9ef059fa01ef3261
                keys.add(token.substring(2, token.length() - 2).trim());
            }
        }

        return keys;
    }

    // For prepared statements we should extract the bindings in order in a list and include duplicate bindings as well.
    public static List<String> extractMustacheKeysInOrder(String template) {
        List<String> keys = new ArrayList<>();

        for (String token : tokenize(template)) {
            if (token.startsWith("{{") && token.endsWith("}}")) {
                // Allowing empty tokens to be added, to be compatible with the previous `extractMustacheKeys` method.
                // Calling `.trim()` before adding because Mustache compiler strips keys in the template before looking
                // up a value. Addresses https://www.notion.so/appsmith/Bindings-with-a-space-at-the-start-fail-to-execute-properly-in-the-API-pane-2eb65d5c6064466b9ef059fa01ef3261
                keys.add(token.substring(2, token.length() - 2).trim());
            }
        }

        return keys;
    }

    public static Set<String> extractMustacheKeysFromFields(Object object) {
        final Set<String> keys = new HashSet<>();

        // Linearized recursive search. Instead of calling this function recursively for nested values, we add them to
        // the end of the queue and process them in a linear fashion. This strategy doesn't suffer from a stack overflow
        // exception, since it doesn't rely on the call-stack. Hence, ideal for processing large DSLs.
        final Queue<Object> processQueue = new LinkedList<>();
        processQueue.add(object);

        while (!processQueue.isEmpty()) {
            final Object obj = processQueue.remove();

            if (obj == null) {
                continue;
            }

            if (isDomainModel(obj.getClass())) {
                // Go deeper *only* if the property belongs to Appsmith's models, and both the source and target
                // values are not null.
                processQueue.addAll(getBeanPropertyValues(obj));

            } else if (obj instanceof List) {
                processQueue.addAll((List) obj);

            } else if (obj instanceof Map) {
                processQueue.addAll(((Map) obj).values());

            } else if (obj instanceof String) {
                keys.addAll(extractMustacheKeys((String) obj));

            }
        }

        return keys;
    }

    private static void clearAndPushToken(StringBuilder tokenBuilder, List<String> tokenList) {
        if (tokenBuilder.length() > 0) {
            tokenList.add(tokenBuilder.toString());
            tokenBuilder.setLength(0);
        }
    }

    /**
     * - If object is null, then return object.
     * - If object is an Appsmith domain object then iterate over all fields of the object and render field values
     * for each of them.
     * - If object is list type then iterate over each item in the list and render field value for them.
     * - If object is map type, then iterate over each value in the map and render field value for them.
     * - If the object is string type (base case), then do the binding substitution if applicable.
     * - If the object falls under none of the above conditions then return the object without doing anything.
     */
    public static <T> T renderFieldValues(T object, Map<String, String> context) {
        if (object == null) {
            return object;
        }

        if (isDomainModel(object.getClass())) {
            try {
                final BeanWrapper sourceBeanWrapper = PropertyAccessorFactory.forBeanPropertyAccess(object);
                for (PropertyDescriptor propertyDescriptor : sourceBeanWrapper.getPropertyDescriptors()) {
                    // For properties like `class` that don't have a set method, just ignore them.
                    if (propertyDescriptor.getWriteMethod() == null) {
                        continue;
                    }

                    String name = propertyDescriptor.getName();
                    Object value = sourceBeanWrapper.getPropertyValue(name);
                    sourceBeanWrapper.setPropertyValue(name, renderFieldValues(value, context));
                }
            } catch (BeansException e) {
                log.error("Exception caught while substituting values in mustache template.", e);
            }
        } else if (object instanceof List) {
            List renderedList = new ArrayList();
            for (Object childValue : (List) object) {
                renderedList.add(renderFieldValues(childValue, context));
            }

            return (T) renderedList;

        } else if (object instanceof Map) {
            Map renderedMap = new HashMap();
            for (Object entry : ((Map) object).entrySet()) {
                renderedMap.put(
                        ((Map.Entry) entry).getKey(), // key
                        renderFieldValues(((Map.Entry) entry).getValue(), context) // value
                );
            }

            return (T) renderedMap;

        } else if (object instanceof String) {
            return (T) render((String) object, context);
        }

        return object;
    }

    /**
     * @param template    : This is the string which contains {{key}} which would be replaced with value
     * @param keyValueMap : This is the map of keys with values.
     * @return It finally returns the string in which all the keys in template have been replaced with values.
     */
    public static String render(String template, Map<String, String> keyValueMap) {
        final StringBuilder rendered = new StringBuilder();

        for (String token : tokenize(template)) {
            if (token.startsWith("{{") && token.endsWith("}}")) {
                rendered.append(keyValueMap.get(token.substring(2, token.length() - 2).trim()));
            } else {
                rendered.append(token);
            }
        }

        return StringEscapeUtils.unescapeHtml4(rendered.toString());
    }

    public static void extractActionNamesAndAddValidActionBindingsToSet(Map<String, DynamicBinding> bindingNames, String mustacheKey) {
        String key = mustacheKey.trim();

        /* Extract all action names in the dynamic bindings */
        Matcher matcher = pattern.matcher(key);
        while (matcher.find()) {
            // For each match, check what combination of action bindings could be calculated
            bindingNames.putAll(DynamicBinding.create(matcher.group()));
        }
    }

    public static Set<String> getPossibleParents(String mustacheKey) {
        Set<String> bindingNames = new HashSet<>();
        String key = mustacheKey.trim();

        // Extract all the words in the dynamic bindings
        Matcher matcher = pattern.matcher(key);

        while (matcher.find()) {
            String word = matcher.group();

            String[] subStrings = word.split(Pattern.quote("."));

            if (subStrings.length < 1) {
                continue;
            }
            // First add the first word since that's the entity name for widgets and non js actions
            bindingNames.add(subStrings[0]);

            if (subStrings.length >= 2) {
                // For JS actions, the first two words are the action name since action name consists of the collection name
                // and the individual action name
                bindingNames.add(subStrings[0] + "." + subStrings[1]);
            }

        }
        return bindingNames;
    }

    public static String replaceMustacheWithPlaceholder(String query, List<String> mustacheBindings) {
        return replaceMustacheUsingPatterns(query, APPSMITH_SUBSTITUTION_PLACEHOLDER, mustacheBindings,
                placeholderTrimmingPattern, APPSMITH_SUBSTITUTION_PLACEHOLDER);
    }

    public static String replaceMustacheWithQuestionMark(String query, List<String> mustacheBindings) {

        return replaceMustacheUsingPatterns(query, "?", mustacheBindings,
                quoteQuestionPattern, postQuoteTrimmingQuestionMark);
    }

    private static String replaceMustacheUsingPatterns(String query, String placeholder, List<String> mustacheBindings,
                                                       Pattern sanitizePattern, String replacement) {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(query);

        Set<String> mustacheSet = new HashSet<>();
        mustacheSet.addAll(mustacheBindings);

        Map<String, String> replaceParamsMap = mustacheSet
                .stream()
                .collect(Collectors.toMap(Function.identity(), v -> placeholder));

        // Replace the mustaches with the values mapped to each mustache in replaceParamsMap
        ActionConfiguration updatedActionConfiguration = renderFieldValues(actionConfiguration, replaceParamsMap);

        String body = updatedActionConfiguration.getBody();

        body = sanitizePattern.matcher(body).replaceAll(replacement);

        return body;
    }

    public static Boolean laxIsBindingPresentInString(String input) {
        return laxMustacheBindingPattern.matcher(input).find();
    }

    public static Set<String> getWordsFromMustache(String mustache) {
        Set<String> words = new HashSet<>();
        String key = mustache.trim();

        // Extract all the words in the dynamic bindings
        Matcher matcher = pattern.matcher(key);

        while (matcher.find()) {
            words.add(matcher.group());
        }

        return words;

    }
}
