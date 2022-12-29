class AuditLog {
  private auditLogs: unknown[] = [];
  private pageId = "";
  private pageName = "";
  private loggingEnabled = false;

  saveLog(log: { actionName: string }) {
    if (!this.loggingEnabled) return;

    this.auditLogs.push({
      ...log,
      pageId: this.pageId,
      pageName: this.pageName,
    });
  }

  setupLogs({ pageId, pageName }: { pageId: string; pageName: string }) {
    this.auditLogs = [];
    this.pageId = pageId;
    this.pageName = pageName;
    this.loggingEnabled = true;
  }

  getLogs() {
    return this.auditLogs;
  }

  close() {
    this.loggingEnabled = false;
  }
}

const auditLogs = new AuditLog();

export default auditLogs;
