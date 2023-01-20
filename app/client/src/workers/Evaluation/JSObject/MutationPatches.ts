class MutationPatches {
  patches: any[] = [];

  add(patch: any) {
    this.patches.push(patch);
  }

  getAll() {
    return this.patches;
  }

  clear() {
    this.patches = [];
  }
}

export const jsVariableUpdates = new MutationPatches();
