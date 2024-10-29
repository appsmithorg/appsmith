package com.appsmith.external.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.EntityDependencyNode;
import com.appsmith.external.models.EntityReferenceType;
import com.appsmith.external.models.MustacheBindingToken;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeansException;
import org.springframework.beans.PropertyAccessorFactory;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.getBeanPropertyValues;
import static com.appsmith.external.helpers.AppsmithBeanUtils.isDomainModel;
import static com.appsmith.external.helpers.SmartSubstitutionHelper.APPSMITH_SUBSTITUTION_PLACEHOLDER;

@Slf4j
public class MustacheHelper {

    private static ObservationRegistry observationRegistry;

    /*
     * This pattern finds all the String which have been extracted from the mustache dynamic bindings.
     * e.g. for the given JS function using action with name "fetchUsers"
     * {{JSON.stringify(fetchUsers)}}
     * This pattern should return ["JSON.stringify", "fetchUsers"]
     */
    private static final Pattern pattern = Pattern.compile("[a-zA-Z_][a-zA-Z0-9._$]*");
    /**
     * Appsmith smart replacement : The regex pattern below looks for '?' or "?". This pattern is later replaced with ?
     * to fit the requirements of prepared statements.
     */
    private static final String regexQuotesTrimming = "([\"']\\?[\"'])";

    private static final Pattern quoteQuestionPattern = Pattern.compile(regexQuotesTrimming);
    // The final replacement string of ? for replacing '?' or "?"
    private static final String postQuoteTrimmingQuestionMark = "\\?";

    /**
     * Appsmith smart replacement with placeholder : The regex pattern below looks for `APPSMITH_SUBSTITUTION_PLACEHOLDER`
     * surrounded by quotes. This pattern is later replaced with just APPSMITH_SUBSTITUTION_PLACEHOLDER to fit the requirements
     * of JSON smart replacement aka trim the quotes present.
     */
    private static final String regexPlaceholderTrimming = "([\"']" + APPSMITH_SUBSTITUTION_PLACEHOLDER + "[\"'])";

    private static final Pattern placeholderTrimmingPattern = Pattern.compile(regexPlaceholderTrimming);

    private static final String laxMustacheBindingRegex = "\\{\\{([\\s\\S]*?)}}";
    private static final Pattern laxMustacheBindingPattern = Pattern.compile(laxMustacheBindingRegex);

    private static final Pattern nestedPathTokenSplitter = Pattern.compile("\\[.*\\]\\.?|\\.");

    // Possible types of entity references that we want to be filtering
    // from the global identifiers found in a dynamic binding
    public static final int EXECUTABLE_ENTITY_REFERENCES = 0b01;
    public static final int WIDGET_ENTITY_REFERENCES = 0b10;

    public MustacheHelper(ObservationRegistry observationRegistry) {
        this.observationRegistry = observationRegistry;
    }

    /**
     * Tokenize a Mustache template string into a list of plain text and Mustache interpolations.
     *
     * @param template String Mustache template string from which to extract plain text and interpolation tokens.
     * @return A list of String tokens, which form parts of the given template String. Joining the strings in this list
     * should give the original template back. The tokens are split such that alternative strings in the list are plain
     * text and the others are mustache interpolations.
     */
    public static List<MustacheBindingToken> tokenize(String template) {
        if (!StringUtils.hasLength(template)) {
            return Collections.emptyList();
        }

        List<MustacheBindingToken> tokens = new ArrayList<>();

        int length = template.length();

        // Following are state variables for the parser.
        // This indicates the state of the pointer. It is `true` when inside mustache double braces, otherwise `false`.
        boolean isInsideMustache = false;

        // This is set to the quote character of a string in JS. When `null`, it means we're not inside any Javascript
        // string. Can only be one of null, double quote ("), single quote (') or back tick (`).
        Character quote = null;

        // Inside mustache JS, this is the current depth of open/close braces.
        int braceDepth = 0;

        StringBuilder currentToken = new StringBuilder().append(template.charAt(0));
        int currentTokenStartIndex = 0;

        // The parser is implemented as a pointer (marked by `i`) that loops over each character in the template string.
        // There's majorly two states for the parser, plain-text-mode and mustache-mode, with the current state
        // indicated by `isInsideMustache`. This is set to `true` when the pointer encounters a `{{` in plain-text-mode.
        // It is set back to `false` when the pointer encounters a `}}` in mustache-mode, but not inside a quoted
        // string. Since the contents inside mustache double-braces is supposed to be valid Javascript expression,
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
                    clearAndPushToken(currentToken, currentTokenStartIndex, tokens, false);
                    currentToken.append(prevChar);
                    currentTokenStartIndex = i - 1;
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
                        clearAndPushToken(currentToken, currentTokenStartIndex, tokens, true);
                        isInsideMustache = false;
                    }

                } else {
                    currentToken.append(currentChar);
                }
            }
        }

        if (currentToken.length() > 0) {
            tokens.add(new MustacheBindingToken(currentToken.toString(), currentTokenStartIndex, false));
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
    public static Set<MustacheBindingToken> extractMustacheKeys(String template) {
        Set<MustacheBindingToken> keys = new HashSet<>();

        for (MustacheBindingToken token : tokenize(template)) {
            if (token.getValue().startsWith("{{") && token.getValue().endsWith("}}")) {
                // Allowing empty tokens to be added, to be compatible with the previous `extractMustacheKeys` method.
                // Calling `.trim()` before adding because Mustache compiler strips keys in the template before looking
                // up a value. Addresses
                // https://www.notion.so/appsmith/Bindings-with-a-space-at-the-start-fail-to-execute-properly-in-the-API-pane-2eb65d5c6064466b9ef059fa01ef3261
                keys.add(new MustacheBindingToken(
                        token.getValue().substring(2, token.getValue().length() - 2),
                        (token.getStartIndex() + 2),
                        false));
            }
        }

        return keys;
    }

    // For prepared statements we should extract the bindings in order in a list and include duplicate bindings as well.
    public static List<MustacheBindingToken> extractMustacheKeysInOrder(String template) {
        List<MustacheBindingToken> keys = new ArrayList<>();

        for (MustacheBindingToken token : tokenize(template)) {
            if (token.getValue().startsWith("{{") && token.getValue().endsWith("}}")) {
                // Allowing empty tokens to be added, to be compatible with the previous `extractMustacheKeys` method.
                // Calling `.trim()` before adding because Mustache compiler strips keys in the template before looking
                // up a value. Addresses
                // https://www.notion.so/appsmith/Bindings-with-a-space-at-the-start-fail-to-execute-properly-in-the-API-pane-2eb65d5c6064466b9ef059fa01ef3261
                keys.add(new MustacheBindingToken(
                        token.getValue()
                                .substring(2, token.getValue().length() - 2)
                                .trim(),
                        (token.getStartIndex() + 2),
                        false));
            }
        }

        return keys;
    }

    public static Set<MustacheBindingToken> extractMustacheKeysFromFields(Object object) {
        final Set<MustacheBindingToken> keys = new HashSet<>();

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

    private static void clearAndPushToken(
            StringBuilder tokenBuilder,
            int tokenStartIndex,
            List<MustacheBindingToken> tokenList,
            boolean includesHandleBars) {
        if (tokenBuilder.length() > 0) {
            tokenList.add(new MustacheBindingToken(tokenBuilder.toString(), tokenStartIndex, includesHandleBars));
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
            return null;
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
            List renderedList = new ArrayList<>();
            for (Object childValue : (List) object) {
                renderedList.add(renderFieldValues(childValue, context));
            }

            return (T) renderedList;

        } else if (object instanceof Map) {
            Map renderedMap = new HashMap<>();
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

        for (MustacheBindingToken token : tokenize(template)) {
            if (token.getValue().startsWith("{{") && token.getValue().endsWith("}}")) {
                // If there is no entry found for the current token in keyValueMap that means the binding is part of the
                // text
                // and hence reflecting the value in the rendered string as is.
                // Example: {{Input.text}} = "This whole string is the value of Input1.text. Even this {{one}}."
                String bindingValue = keyValueMap.get(token.getValue()
                        .substring(2, token.getValue().length() - 2)
                        .trim());
                if (bindingValue != null) {
                    rendered.append(bindingValue);
                } else {
                    rendered.append(token.getValue());
                }
            } else {
                rendered.append(token.getValue());
            }
        }
        /**
         * ReplaceAll is used to escape the double quotes symbol with \" so that
         * JSON remains valid.
         * &quot; and &#34; both are HTML reserved characters for double quotes (")
         */
        return StringEscapeUtils.unescapeHtml4(
                rendered.toString().replaceAll("&quot;", "\\\\&quot;").replaceAll("&#34;", "\\\\&#34;"));
    }

    /**
     * Depending on the entity types that the caller has asked for, this method analyzed the global references found in each binding
     * and creates entity dependency nodes out of the references that would qualify as a reference of a specific entity type
     *
     * @param bindingAndPossibleReferencesFlux
     * @param types
     * @return
     */
    public static Mono<Map<String, Set<EntityDependencyNode>>> getPossibleEntityParentsMap(
            Flux<Tuple2<String, Set<String>>> bindingAndPossibleReferencesFlux, int types) {

        return bindingAndPossibleReferencesFlux.collect(HashMap::new, (map, tuple) -> {
            String bindingValue = tuple.getT1();
            HashSet<EntityDependencyNode> totalParents = new HashSet<>();
            tuple.getT2().forEach(reference -> {
                if ((types & EXECUTABLE_ENTITY_REFERENCES) == EXECUTABLE_ENTITY_REFERENCES) {
                    totalParents.addAll(MustacheHelper.getPossibleActions(reference));
                }
                if ((types & WIDGET_ENTITY_REFERENCES) == WIDGET_ENTITY_REFERENCES) {
                    totalParents.addAll(MustacheHelper.getPossibleWidgets(reference));
                }
            });
            map.put(bindingValue, totalParents);
        });
    }

    /**
     * Given a global reference, this method returns any possible combinations of widgets
     * that could be derived out of the reference string. The rules for this are as follows:
     * 1) Irrespective of whether the reference string has a dot notation reference, as long as it is not empty,
     * pick the first word in the string as a possible widget reference.
     * Eg: Text1 which could be derived from {{ Text1 }}
     * Eg: Text1 which could be derived from {{ Text1.text }}
     * <p>
     * Please note that we do not filter out any invalid references at this point,
     * because we do not have context of the global namespace here.
     *
     * @param reference The string reference computed by AST logic.
     * @return A set of all possible widget dependencies that could exist in the given reference
     */
    public static Set<EntityDependencyNode> getPossibleWidgets(String reference) {
        Set<EntityDependencyNode> dependencyNodes = new HashSet<>();
        String key = reference.trim();

        String[] subStrings = nestedPathTokenSplitter.split(key);

        if (subStrings.length < 1) {
            return dependencyNodes;
        } else {
            EntityDependencyNode entityDependencyNode =
                    new EntityDependencyNode(EntityReferenceType.WIDGET, subStrings[0], reference, null, null);
            dependencyNodes.add(entityDependencyNode);
        }

        return dependencyNodes;
    }

    /**
     * Given a global reference, this method returns any possible combinations of actions or JS actions
     * that could be derived out of the reference string. The rules for this are as follows:
     * 1) If the reference string has exactly one dot notation reference in its path, it could be a sync JS function call
     * Eg: JsObject1.syncJsFunc which could be derived from {{ JsObject1.syncJsFunc() }}
     * If the reference string has more than one dot notation reference in its path, it could either be -
     * 2) An action reference where the data from the actions is consumed using the .data reference
     * Eg: Action1.data.users which could be derived from {{ Action1.data.users }}
     * 3) An asynchronous JS function that is being made to run on page load using its fully qualified name followed by
     * the .data reference
     * Eg: JsObject2.asyncJsFunc.data which could be derived from {{ JsObject2.asyncFunc.data }}
     * <p>
     * Please note that we do not filter out any invalid references at this point,
     * because we do not have context of the global namespace here.
     *
     * @param reference The string reference computed by AST logic
     * @return A set of all possible action or JS function dependencies that could exist in the given reference
     */
    public static Set<EntityDependencyNode> getPossibleActions(String reference) {
        Set<EntityDependencyNode> dependencyNodes = new HashSet<>();
        String key = reference.trim();

        String[] subStrings = nestedPathTokenSplitter.split(key);

        if (subStrings.length < 1) {
            return dependencyNodes;
        }

        if (subStrings.length == 2) {
            // This could qualify if it is a sync JS function call, even if it is called `JsObject1.data()`
            // For sync JS actions, the entire reference could be a function call
            EntityDependencyNode entityDependencyNode =
                    new EntityDependencyNode(EntityReferenceType.JSACTION, key, reference, false, null);
            dependencyNodes.add(entityDependencyNode);
            if ("data".equals(subStrings[1])) {
                // This means it is a valid API/query reference
                // For queries and APIs, the first word is the action name
                EntityDependencyNode actionEntityDependencyNode =
                        new EntityDependencyNode(EntityReferenceType.ACTION, subStrings[0], reference, false, null);
                dependencyNodes.add(actionEntityDependencyNode);
            }
        } else if (subStrings.length > 2) {
            if ("data".equals(subStrings[1])) {
                // This means it is a valid API/query reference
                // For queries and APIs, the first word is the action name
                EntityDependencyNode actionEntityDependencyNode =
                        new EntityDependencyNode(EntityReferenceType.ACTION, subStrings[0], reference, false, null);
                dependencyNodes.add(actionEntityDependencyNode);
            }
            if ("data".equals(subStrings[2])) {
                // For JS actions, the first two words are the action name since action name consists of
                // the collection name and the individual action name
                // We don't know if this is a run for sync or async JS action at this point,
                // since both would be valid
                EntityDependencyNode entityDependencyNode = new EntityDependencyNode(
                        EntityReferenceType.JSACTION, subStrings[0] + "." + subStrings[1], reference, null, null);
                dependencyNodes.add(entityDependencyNode);
            }
        }
        return dependencyNodes;
    }

    /**
     * This method is used as a fallback for setups where the RTS server is not accessible.
     * It counts all words as possible entity references. This is obviously going to
     * continue to give inaccurate results, but is required to maintain backward compatibility
     *
     * @param mustacheKey The mustache binding to find references from
     * @return A set of identified references from the mustache binding value
     */
    public static Set<String> getPossibleParentsOld(String mustacheKey) {
        Set<String> bindingNames = new HashSet<>();
        String key = mustacheKey.trim();

        // Extract all the words in the dynamic bindings
        Matcher matcher = pattern.matcher(key);

        while (matcher.find()) {
            String word = matcher.group();
            bindingNames.add(word);
        }

        return bindingNames;
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
                // For JS actions, the first two words are the action name since action name consists of the collection
                // name
                // and the individual action name
                bindingNames.add(subStrings[0] + "." + subStrings[1]);
            }
        }
        return bindingNames;
    }

    public static String replaceMustacheWithPlaceholder(String query, List<MustacheBindingToken> mustacheBindings) {
        return replaceMustacheUsingPatterns(
                query,
                APPSMITH_SUBSTITUTION_PLACEHOLDER,
                mustacheBindings,
                placeholderTrimmingPattern,
                APPSMITH_SUBSTITUTION_PLACEHOLDER);
    }

    public static String replaceMustacheWithQuestionMark(String query, List<MustacheBindingToken> mustacheBindings) {

        return replaceMustacheUsingPatterns(
                query, "?", mustacheBindings, quoteQuestionPattern, postQuoteTrimmingQuestionMark);
    }

    private static String replaceMustacheUsingPatterns(
            String query,
            String placeholder,
            List<MustacheBindingToken> mustacheBindings,
            Pattern sanitizePattern,
            String replacement) {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(query);

        Set<MustacheBindingToken> mustacheSet = new HashSet<>(mustacheBindings);

        Map<String, String> replaceParamsMap = mustacheSet.stream()
                .map(mustacheToken -> mustacheToken.getValue())
                .distinct()
                .collect(Collectors.toMap(k -> k, v -> placeholder));

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
