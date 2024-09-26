import type { Span } from "@opentelemetry/api";
import { InstrumentationBase } from "@opentelemetry/instrumentation";
import { startRootSpan, startNestedSpan } from "./generateTraces";
import { onLCP, onFCP } from "web-vitals/attribution";
import type {
  LCPMetricWithAttribution,
  FCPMetricWithAttribution,
  NavigationTimingPolyfillEntry,
} from "web-vitals";
import isString from "lodash/isString";

type TNavigator = Navigator & {
  deviceMemory: number;
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
};

export class PageLoadInstrumentation extends InstrumentationBase {
  // PerformanceObserver to observe resource timings
  resourceTimingObserver: PerformanceObserver | null = null;
  // Root span for the page load instrumentation
  rootSpan: Span;
  // List of resource URLs to ignore
  ignoreResourceUrls: string[] = [];
  // Flag to check if navigation entry was pushed
  wasNavigationEntryPushed: boolean = false;
  // Set to keep track of resource entries
  resourceEntriesSet: Set<string> = new Set();
  // Timeout for polling resource entries
  resourceEntryPollTimeout: number | null = null;

  constructor({ ignoreResourceUrls = [] }: { ignoreResourceUrls?: string[] }) {
    // Initialize the base instrumentation with the name and version
    super("appsmith-page-load-instrumentation", "1.0.0", {
      enabled: true,
    });
    this.ignoreResourceUrls = ignoreResourceUrls;
    // Start the root span for the page load
    this.rootSpan = startRootSpan("PAGE_LOAD", {}, 0);

    // Initialize the instrumentation after starting the root span
    this.init();
  }

  init() {
    // Register connection change listener
    this.addConnectionAttributes();

    // Add device attributes to the root span
    this.addDeviceAttributes();

    // Listen for LCP and FCP events
    // reportAllChanges: true will report all LCP and FCP events
    // binding the context to the class to access class properties
    onLCP(this.onLCPReport.bind(this), { reportAllChanges: true });
    onFCP(this.onFCPReport.bind(this), { reportAllChanges: true });

    // Check if PerformanceObserver is available
    if (PerformanceObserver) {
      this.observeResourceTimings();
    } else {
      // If PerformanceObserver is not available, fallback to polling
      this.pollResourceTimingEntries();
    }
  }

  enable() {
    // enable method is present in the base class and needs to be implemented
    // Leaving it empty as there is no need to do anything here
  }

  private addDeviceAttributes() {
    this.rootSpan.setAttributes({
      deviceMemory: (navigator as TNavigator).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
    });
  }

  private addConnectionAttributes() {
    if ((navigator as TNavigator).connection) {
      const { downlink, effectiveType, rtt, saveData } = (
        navigator as TNavigator
      ).connection;

      this.rootSpan.setAttributes({
        effectiveConnectionType: effectiveType,
        connectionDownlink: downlink,
        connectionRtt: rtt,
        connectionSaveData: saveData,
      });
    }
  }

  // Handler for LCP report
  private onLCPReport(metric: LCPMetricWithAttribution) {
    const {
      attribution: { lcpEntry },
    } = metric;

    if (lcpEntry) {
      this.pushLcpTimingToSpan(lcpEntry);
    }
  }

  // Handler for FCP report
  private onFCPReport(metric: FCPMetricWithAttribution) {
    const {
      attribution: { fcpEntry, navigationEntry },
    } = metric;

    // Push navigation entry only once
    // This is to avoid pushing multiple navigation entries
    if (navigationEntry && !this.wasNavigationEntryPushed) {
      this.pushNavigationTimingToSpan(navigationEntry);
      this.wasNavigationEntryPushed = true;
    }

    if (fcpEntry) {
      this.pushPaintTimingToSpan(fcpEntry);
    }
  }

  private getElementName(element?: Element | null, depth = 0): string {
    // Limit the depth to 3 to avoid long element names
    if (!element || depth > 3) {
      return "";
    }

    const elementTestId = element.getAttribute("data-testid");
    const className = isString(element.className)
      ? "." + element.className.split(" ").join(".")
      : "";
    const elementId = element.id ? `#${element.id}` : "";

    const elementName = `${element.tagName}${elementId}${className}:${elementTestId}`;

    // Recursively get the parent element names
    const parentElementName = this.getElementName(
      element.parentElement,
      depth + 1,
    );

    return `${parentElementName} > ${elementName}`;
  }

  // Convert kebab-case to SCREAMING_SNAKE_CASE
  private kebabToScreamingSnakeCase(str: string) {
    return str.replace(/-/g, "_").toUpperCase();
  }

  // Push paint timing to span
  private pushPaintTimingToSpan(entry: PerformanceEntry) {
    const paintSpan = startNestedSpan(
      this.kebabToScreamingSnakeCase(entry.name),
      this.rootSpan,
      {},
      0,
    );

    paintSpan.end(entry.startTime);
  }

  // Push LCP timing to span
  private pushLcpTimingToSpan(entry: LargestContentfulPaint) {
    const { element, entryType, loadTime, renderTime, startTime, url } = entry;

    const lcpSpan = startNestedSpan(
      this.kebabToScreamingSnakeCase(entryType),
      this.rootSpan,
      {
        url,
        renderTime,
        element: this.getElementName(element),
        entryType,
        loadTime,
      },
      0,
    );

    lcpSpan.end(startTime);
  }

  // Push navigation timing to span
  private pushNavigationTimingToSpan(
    entry: PerformanceNavigationTiming | NavigationTimingPolyfillEntry,
  ) {
    const {
      connectEnd,
      connectStart,
      domainLookupEnd,
      domainLookupStart,
      domComplete,
      domContentLoadedEventEnd,
      domContentLoadedEventStart,
      domInteractive,
      entryType,
      fetchStart,
      loadEventEnd,
      loadEventStart,
      name: url,
      redirectEnd,
      redirectStart,
      requestStart,
      responseEnd,
      responseStart,
      secureConnectionStart,
      startTime: navigationStartTime,
      type: navigationType,
      unloadEventEnd,
      unloadEventStart,
      workerStart,
    } = entry;

    this.rootSpan.setAttributes({
      connectEnd,
      connectStart,
      decodedBodySize:
        (entry as PerformanceNavigationTiming).decodedBodySize || 0,
      domComplete,
      domContentLoadedEventEnd,
      domContentLoadedEventStart,
      domInteractive,
      domainLookupEnd,
      domainLookupStart,
      encodedBodySize:
        (entry as PerformanceNavigationTiming).encodedBodySize || 0,
      entryType,
      fetchStart,
      initiatorType:
        (entry as PerformanceNavigationTiming).initiatorType || "navigation",
      loadEventEnd,
      loadEventStart,
      nextHopProtocol:
        (entry as PerformanceNavigationTiming).nextHopProtocol || "",
      redirectCount: (entry as PerformanceNavigationTiming).redirectCount || 0,
      redirectEnd,
      redirectStart,
      requestStart,
      responseEnd,
      responseStart,
      secureConnectionStart,
      navigationStartTime,
      transferSize: (entry as PerformanceNavigationTiming).transferSize || 0,
      navigationType,
      url,
      unloadEventEnd,
      unloadEventStart,
      workerStart,
    });

    this.rootSpan?.end(entry.domContentLoadedEventEnd);
  }

  // Observe resource timings using PerformanceObserver
  private observeResourceTimings() {
    this.resourceTimingObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      const resources = this.getResourcesToTrack(entries);

      resources.forEach((entry) => {
        this.pushResourceTimingToSpan(entry);
      });
    });

    this.resourceTimingObserver.observe({
      type: "resource",
      buffered: true,
    });
  }

  // Filter out resources to track based on ignoreResourceUrls
  private getResourcesToTrack(resources: PerformanceResourceTiming[]) {
    return resources.filter(({ name }) => {
      return !this.ignoreResourceUrls.some((ignoreUrl) =>
        name.includes(ignoreUrl),
      );
    });
  }

  // Push resource timing to span
  private pushResourceTimingToSpan(entry: PerformanceResourceTiming) {
    const {
      connectEnd,
      connectStart,
      decodedBodySize,
      domainLookupEnd,
      domainLookupStart,
      duration: resourceDuration,
      encodedBodySize,
      entryType,
      fetchStart,
      initiatorType,
      name: url,
      nextHopProtocol,
      redirectEnd,
      redirectStart,
      requestStart,
      responseEnd,
      responseStart,
      secureConnectionStart,
      transferSize,
      workerStart,
    } = entry;

    const resourceSpan = startNestedSpan(
      entry.name,
      this.rootSpan,
      {
        connectEnd,
        connectStart,
        decodedBodySize,
        domainLookupEnd,
        domainLookupStart,
        encodedBodySize,
        entryType,
        fetchStart,
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        firstInterimResponseStart: (entry as any).firstInterimResponseStart,
        initiatorType,
        nextHopProtocol,
        redirectEnd,
        redirectStart,
        requestStart,
        responseEnd,
        responseStart,
        resourceDuration,
        secureConnectionStart,
        transferSize,
        url,
        workerStart,
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderBlockingStatus: (entry as any).renderBlockingStatus,
      },
      entry.startTime,
    );

    resourceSpan.end(entry.startTime + entry.responseEnd);
  }

  // Get unique key for a resource entry
  private getResourceEntryKey(entry: PerformanceResourceTiming) {
    return `${entry.name}:${entry.startTime}:${entry.entryType}`;
  }

  // Poll resource timing entries periodically
  private pollResourceTimingEntries() {
    // Clear the previous timeout
    if (this.resourceEntryPollTimeout) {
      clearInterval(this.resourceEntryPollTimeout);
    }

    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];

    const filteredResources = this.getResourcesToTrack(resources);

    filteredResources.forEach((entry) => {
      const key = this.getResourceEntryKey(entry);

      if (!this.resourceEntriesSet.has(key)) {
        this.pushResourceTimingToSpan(entry);
        this.resourceEntriesSet.add(key);
      }
    });

    // Poll every 5 seconds
    this.resourceEntryPollTimeout = setTimeout(
      this.pollResourceTimingEntries,
      5000,
    );
  }

  disable(): void {
    if (this.resourceTimingObserver) {
      this.resourceTimingObserver.disconnect();
    }

    if (this.rootSpan) {
      this.rootSpan.end();
    }
  }
}
