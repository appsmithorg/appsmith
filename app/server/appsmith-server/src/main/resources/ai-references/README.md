# AI Reference Files

These files provide context to the Appsmith AI Assistant, helping it give more accurate, Appsmith-specific responses.

## Files

| File | Purpose | Used When |
|------|---------|-----------|
| `javascript-reference.md` | JS patterns, bindings, async, global APIs | JavaScript editor |
| `sql-reference.md` | SQL patterns, parameterization, DB tips | SQL query editors |
| `graphql-reference.md` | GraphQL queries, mutations, pagination | GraphQL editor |
| `common-issues.md` | Troubleshooting gotchas | All editors (appended) |

## Customizing AI References

You can override these bundled files with your own custom references.

### Option 1: Docker Volume Mount

```bash
# Create custom references directory
mkdir -p /path/to/my-ai-references

# Copy bundled files as starting point (optional)
# Then edit them to add your organization's patterns

# Run Appsmith with volume mount
docker run -d \
  -v /path/to/my-ai-references:/appsmith/config/ai-references:ro \
  appsmith/appsmith-ee
```

### Option 2: Docker Compose

```yaml
services:
  appsmith:
    image: appsmith/appsmith-ee
    volumes:
      - ./my-ai-references:/appsmith/config/ai-references:ro
```

### Option 3: Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: appsmith-ai-references
data:
  javascript-reference.md: |
    # Your Custom JavaScript Reference

    ## Your Patterns
    ...

  sql-reference.md: |
    # Your Custom SQL Reference
    ...
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: appsmith
spec:
  template:
    spec:
      containers:
        - name: appsmith
          volumeMounts:
            - name: ai-references
              mountPath: /appsmith/config/ai-references
              readOnly: true
      volumes:
        - name: ai-references
          configMap:
            name: appsmith-ai-references
```

### Option 4: Custom Path via Environment Variable

```bash
# Set custom path
export APPSMITH_AI_REFERENCES_PATH=/custom/path/to/references

# Place your files there
/custom/path/to/references/
├── javascript-reference.md
├── sql-reference.md
├── graphql-reference.md
└── common-issues.md
```

## File Format Guidelines

Each reference file should:

1. **Start with a heading**: `# Appsmith [Mode] Reference`

2. **Include sections** with `##` headings for different topics

3. **Provide code examples** in fenced code blocks:
   ```javascript
   {{Input1.text}}
   ```

4. **Be concise**: ~400-800 words per file (too long = slower AI responses)

5. **Focus on Appsmith-specific patterns**, not general programming

### Example Structure

```markdown
# Appsmith JavaScript Reference

## Binding Syntax

Use `{{ }}` for dynamic values.

```javascript
{{Table1.selectedRow.id}}
{{Query1.data}}
```

## Global APIs

```javascript
showAlert("Message", "success");
storeValue("key", value);
navigateTo("PageName");
```

## Your Organization's Patterns

Add your team's specific patterns here...
```

## Fallback Behavior

The AI Assistant loads references with this priority:

1. **External path** (`/appsmith/config/ai-references/` or custom)
2. **Bundled files** (these files in the JAR)
3. **Inline fallback** (minimal hardcoded prompts)

If external files are missing or unreadable, the bundled files are used automatically. The AI Assistant never fails due to missing reference files.

## Generating Custom References

For advanced users with large knowledge bases, see the [appsmith-ai-helper](https://github.com/appsmithorg/appsmith-ai-helper) tool that can generate reference files from:
- Documentation directories
- OpenAI vector stores
- Helpdesk solution exports
