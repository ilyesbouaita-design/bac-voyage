// =============================================================================
// embedding-service.ts
// Optional, lazily-loaded browser-side embedding model for semantic grading.
//
// Wraps @huggingface/transformers (transformers.js). The package is NOT assumed
// to be installed — every import and call is guarded so that when it is absent
// (or the model cannot download because the user is offline) the service simply
// reports isReady() === false and returns null. The grading engine then falls
// back to keyword / rule-based layers.
// =============================================================================

// Model: multilingual-e5-small produces 384-dim sentence embeddings and handles
// German well. e5 models expect a "query: " / "passage: " prefix; we use
// "query: " for both sides since we compare two short answers symmetrically.
const MODEL_ID = "Xenova/multilingual-e5-small";
const E5_PREFIX = "query: ";

class EmbeddingService {
  private pipeline: any = null;
  private loading = false;
  private loadPromise: Promise<void> | null = null;
  private failed = false; // permanent-fail flag (package missing / model error)

  /**
   * Lazily load the feature-extraction pipeline. Safe to call repeatedly:
   * concurrent callers share a single in-flight promise, and a prior failure
   * short-circuits without retrying the (expensive) dynamic import.
   */
  async load(): Promise<void> {
    if (this.pipeline) return;
    if (this.failed) return;
    if (this.loadPromise) return this.loadPromise;

    this.loading = true;
    this.loadPromise = (async () => {
      try {
        // Dynamic import so bundlers don't hard-require the package at build
        // time. The /* @vite-ignore */ hint keeps Vite from trying to resolve
        // an optional dependency. Wrapped in try/catch: if the module is not
        // installed this throws and we degrade gracefully.
        const mod: any = await import(
          /* @vite-ignore */ "@huggingface/transformers"
        ).catch(() => null);

        if (!mod || typeof mod.pipeline !== "function") {
          this.failed = true;
          return;
        }

        // q8 quantization keeps the download small (~30MB) and fast on CPU.
        this.pipeline = await mod.pipeline("feature-extraction", MODEL_ID, {
          dtype: "q8",
        });
      } catch (err) {
        // Offline, model too large, WASM unsupported, etc. — degrade quietly.
        this.failed = true;
        this.pipeline = null;
        // eslint-disable-next-line no-console
        console.warn(
          "[embedding-service] Embedding model unavailable, falling back:",
          (err as Error)?.message ?? err
        );
      } finally {
        this.loading = false;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Embed a single piece of text. Returns a Float32Array (mean-pooled,
   * L2-normalized) or null if the model is unavailable.
   */
  async embed(text: string): Promise<Float32Array | null> {
    if (!text || !text.trim()) return null;
    if (!this.pipeline && !this.failed) {
      await this.load();
    }
    if (!this.pipeline) return null;

    try {
      const output = await this.pipeline(E5_PREFIX + text.trim(), {
        pooling: "mean",
        normalize: true,
      });
      // transformers.js returns a Tensor with a `.data` typed array.
      const data: Float32Array = output?.data
        ? Float32Array.from(output.data)
        : Float32Array.from(output ?? []);
      return data.length ? data : null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[embedding-service] embed() failed:", (err as Error)?.message ?? err);
      return null;
    }
  }

  /**
   * Cosine similarity between two texts in [-1, 1] (typically [0,1] for e5),
   * or null if embeddings could not be produced.
   */
  async cosineSimilarity(a: string, b: string): Promise<number | null> {
    const [ea, eb] = await Promise.all([this.embed(a), this.embed(b)]);
    if (!ea || !eb || ea.length !== eb.length) return null;

    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < ea.length; i++) {
      dot += ea[i] * eb[i];
      na += ea[i] * ea[i];
      nb += eb[i] * eb[i];
    }
    if (na === 0 || nb === 0) return null;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  /** True once the pipeline is loaded and usable. */
  isReady(): boolean {
    return this.pipeline !== null;
  }

  /** True while a load is in progress. */
  isLoading(): boolean {
    return this.loading;
  }

  /** True if loading permanently failed (package missing / offline). */
  hasFailed(): boolean {
    return this.failed;
  }
}

export const embeddingService = new EmbeddingService();
export { EmbeddingService };
export default embeddingService;
