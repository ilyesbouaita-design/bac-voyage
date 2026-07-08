// =============================================================================
// embedding-service.ts
// Optional browser-side embedding for semantic grading (Layer 4).
// The @huggingface/transformers package is NOT required — if it's not installed
// or the model can't load, isReady() returns false and the grading engine falls
// back to keyword/rule layers automatically.
// =============================================================================

const MODEL_ID = "Xenova/multilingual-e5-small";
const E5_PREFIX = "query: ";

class EmbeddingService {
  private pipeline: any = null;
  private loading = false;
  private loadPromise: Promise<void> | null = null;
  private failed = false;

  async load(): Promise<void> {
    if (this.pipeline || this.failed) return;
    if (this.loadPromise) return this.loadPromise;

    this.loading = true;
    this.loadPromise = (async () => {
      try {
        // Use Function constructor to prevent ANY bundler (Vite/Rollup/esbuild)
        // from statically analyzing this import. The package is optional.
        const dynamicImport = new Function("m", "return import(m)");
        const mod = await dynamicImport("@huggingface/transformers").catch(() => null);

        if (!mod || typeof mod.pipeline !== "function") {
          this.failed = true;
          return;
        }

        this.pipeline = await mod.pipeline("feature-extraction", MODEL_ID, {
          dtype: "q8",
        });
      } catch {
        this.failed = true;
        this.pipeline = null;
      } finally {
        this.loading = false;
      }
    })();

    return this.loadPromise;
  }

  async embed(text: string): Promise<Float32Array | null> {
    if (!text?.trim()) return null;
    if (!this.pipeline && !this.failed) await this.load();
    if (!this.pipeline) return null;

    try {
      const output = await this.pipeline(E5_PREFIX + text.trim(), {
        pooling: "mean",
        normalize: true,
      });
      const data = output?.data
        ? Float32Array.from(output.data)
        : Float32Array.from(output ?? []);
      return data.length ? data : null;
    } catch {
      return null;
    }
  }

  async cosineSimilarity(a: string, b: string): Promise<number | null> {
    const [ea, eb] = await Promise.all([this.embed(a), this.embed(b)]);
    if (!ea || !eb || ea.length !== eb.length) return null;

    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < ea.length; i++) {
      dot += ea[i] * eb[i];
      na += ea[i] * ea[i];
      nb += eb[i] * eb[i];
    }
    return (na === 0 || nb === 0) ? null : dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  isReady(): boolean { return this.pipeline !== null; }
  isLoading(): boolean { return this.loading; }
  hasFailed(): boolean { return this.failed; }
}

export const embeddingService = new EmbeddingService();
export { EmbeddingService };
export default embeddingService;
