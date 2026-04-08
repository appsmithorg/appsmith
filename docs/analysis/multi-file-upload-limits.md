# Multi-File Upload Limits — Analysis

## Summary

There is **no explicit file count limit** in Appsmith. The customer's issues are likely caused by **combined limits** on total request size and per-file size, not a hard cap on the number of files.

---

## Limits by Layer

### 1. FilePicker Widget (FilePickerWidgetV2 / FilepickerWidget)

| Setting | Default | Validation | Notes |
|---------|---------|------------|-------|
| **Max no. of files** (`maxNumFiles`) | 1 | `ValidationTypes.NUMBER` — **no min/max** | User can set any positive number (e.g. 100, 1000). No upper bound enforced. |
| **Max file size (MB)** (`maxFileSize`) | 5 | min: 1, max: 200 | Per-file limit. |

- Uppy receives `maxNumberOfFiles: this.props.maxNumFiles`. When `null`/`undefined`, Uppy allows unlimited files.
- Default `maxNumFiles: 1` means single-file by default; users must change it for multi-file.

### 2. MultiFilePickerControl (JSON Form / Plugin Forms)

- **No file count limit.** Only `maxFileSizeInBytes` for **total** size of all files combined.
- Used in datasource forms (e.g. S3, AI plugins) with `uploadToTrigger: true`.
- Files are sent via `PluginsApi.uploadFiles(pluginId, files, params)` — no client-side file count check.

### 3. Server-Side Limits

| Limit | Value | Config | Location |
|-------|-------|--------|----------|
| **Multipart request size (in-memory)** | 150 MB | `APPSMITH_CODEC_SIZE` | `application-ce.properties`: `spring.webflux.multipart.max-in-memory-size` |
| **Max part header size** | 128 KB | Hardcoded | `WebConfig.java` |
| **Plugin response size** | 5 MB | `APPSMITH_PLUGIN_MAX_RESPONSE_SIZE_MB` | `application-ce.properties` |

The **150 MB** limit applies to the **entire multipart request** (all files + form fields). This is the main constraint for multi-file uploads.

### 4. Client-Side Constants

| Constant | Value | Use |
|----------|-------|-----|
| `FILE_SIZE_LIMIT_FOR_BLOBS` | 5 MB | Binary format: files &lt; 5 MB use in-memory read; larger use streaming |
| `FILE_UPLOAD_TRIGGER_TIMEOUT_MS` | (in ApiConstants) | Timeout for plugin trigger uploads |

---

## Likely Causes of Customer Issues

### Scenario A: Total Size Exceeds 150 MB

- User sets `maxNumFiles: 50` and selects 50 files.
- Total size &gt; 150 MB → server rejects with **413 Payload Too Large** or similar.
- Error may not clearly indicate it's due to combined file size.

### Scenario B: Many Small Files Hitting 150 MB

- Example: 500 files × 400 KB ≈ 200 MB → exceeds 150 MB.
- User may assume the limit is on file count, not total size.

### Scenario C: Timeout on Large Uploads

- Many files or large total size → upload takes long.
- `FILE_UPLOAD_TRIGGER_TIMEOUT_MS` may be exceeded before upload completes.

### Scenario D: Default `maxNumFiles: 1`

- If the widget is not configured for multi-file, `maxNumFiles` stays 1.
- User expects multi-file but only one file is accepted (Uppy restriction).

### Scenario E: Part Header Size (128 KB)

- Very long file names or metadata in multipart headers.
- Can trigger "Part headers exceeded the memory usage limit of 131072 bytes" (see `ApplicationControllerTest`).

---

## Intended vs Potential Bug

| Aspect | Status | Notes |
|--------|--------|-------|
| **150 MB total request size** | Intended | Spring/WebFlux default; configurable via `APPSMITH_CODEC_SIZE` |
| **No file count limit** | By design | No explicit cap; effectively limited by 150 MB |
| **maxNumFiles has no upper bound** | Design gap | User can set 10000; only total size will eventually fail |
| **Unclear error messages** | Potential bug | 413/500 may not explain "too many files" or "total size" |
| **MultiFilePickerControl has no maxNumFiles** | Inconsistency | FilePicker widget has it; form control does not |

---

## Recommendations

### For the Customer

1. **Check total size**  
   Sum of all selected files must be &lt; 150 MB (or your configured `APPSMITH_CODEC_SIZE`).

2. **Check widget config**  
   Ensure "Max no. of files" is set to the desired value (default is 1).

3. **Check error**  
   - 413 → total request too large  
   - Timeout → upload too slow or too large  
   - Part header error → very long file names or metadata

### For the Codebase

1. **Add validation for `maxNumFiles`**  
   e.g. min: 1, max: 100 (or similar) to avoid obviously invalid values.

2. **Improve error handling**  
   When 413 occurs, surface a message like:  
   "Total size of selected files exceeds the 150 MB limit. Reduce the number or size of files."

3. **Document limits**  
   In widget help text or docs:  
   - Per-file max: 200 MB (widget)  
   - Total request max: 150 MB (server, configurable)

4. **Consider `maxNumFiles` for MultiFilePickerControl**  
   Align behavior with the FilePicker widget if multi-file is supported.

---

## Files Reference

- `app/client/src/widgets/FilePickerWidgetV2/widget/index.tsx` — defaults, validation, Uppy config
- `app/client/src/widgets/FilepickerWidget/widget/index.tsx` — legacy FilePicker
- `app/client/src/components/formControls/MultiFilePickerControl.tsx` — form control, no file count limit
- `app/client/src/api/PluginApi.ts` — `uploadFiles` (no count limit)
- `app/server/appsmith-server/src/main/resources/application-ce.properties` — 150 MB limit
- `app/server/appsmith-server/src/main/java/com/appsmith/server/configurations/WebConfig.java` — 128 KB header limit
- `app/client/src/constants/WidgetConstants.tsx` — `FILE_SIZE_LIMIT_FOR_BLOBS` (5 MB)
