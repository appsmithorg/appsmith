# Helm Chart Unit Tests

This directory contains unit tests for our Helm charts using [helm-unittest](https://github.com/helm-unittest/helm-unittest), a BDD-style testing framework for Helm charts.

## Running Tests Locally

You can run the tests locally using Docker:

```bash
docker run -ti --rm -v $(pwd):/apps helmunittest/helm-unittest .
```

## Snapshot Testing

Our tests use snapshot testing to validate the rendered Kubernetes manifests. This ensures that any changes to the defaults are intentional and reviewed.

### Updating Snapshots

When making changes that affect the rendered output (like updating labels or other metadata), you'll need to update the snapshots. This is particularly important during releases when labels are updated.

To update snapshots, run the tests with the `-u` flag:

```bash
docker run -ti --rm -v $(pwd):/apps helmunittest/helm-unittest -u .
```

**Important**: Always review the changes in the snapshots before committing them to ensure they match your expectations.

## Testing Custom Features

### Branding Configuration

The chart includes support for custom branding configuration. To test the branding feature, you can use the following example values:

```yaml
branding:
  enabled: true
  colors:
    primary: "#FF6B35"
    background: "#FFFFFF"
    font: "#333333"
    disabled: "#CCCCCC"
    hover: "#FF8C5A"
    active: "#E55A2B"
```

This will create a ConfigMap containing an `appsmith-branding.json` file with the brand colors. The ConfigMap will be named `<release-name>-branding`.

**Example test command:**

```bash
# Test with custom branding values
helm template test-release . --values tests/custom-branding-values.yaml | grep -A 10 "appsmith-branding.json"
```

**Validating the branding ConfigMap:**

The branding ConfigMap should contain valid JSON with the following structure:

```json
{
  "brandColors": {
    "primary": "#FF6B35",
    "background": "#FFFFFF",
    "font": "#333333",
    "disabled": "#CCCCCC",
    "hover": "#FF8C5A",
    "active": "#E55A2B"
  }
}
```

**Color format requirements:**
- All color values should be in hex format (e.g., `#FF6B35` or `#FFF`)
- Empty strings are allowed for optional colors
- The schema validates color patterns using regex: `^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})?$`

## Documentation

For more information about helm-unittest, including:
- Writing test cases
- Available assertions
- Test suite configuration
- Best practices

Please refer to the [official helm-unittest documentation](https://github.com/helm-unittest/helm-unittest).
