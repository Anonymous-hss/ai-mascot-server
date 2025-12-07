import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Embeddings } from "@langchain/core/embeddings";

/**
 * Task types for intelligent model routing
 */
export type TaskType = 
  | "strategic"      // Strategic analysis, planning, reasoning
  | "creative"       // Creative content, copywriting, campaigns
  | "research"       // Deep research, competitive analysis
  | "validation"     // JSON validation, schema checking
  | "embedding"      // Text embeddings
  | "general";       // General purpose

/**
 * Model configuration interface
 */
export interface ModelConfig {
  name: string;
  provider: "ollama" | "grok" | "gemini";
  temperature: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * Model Router - Intelligently selects the best model for each task
 * Implements fault tolerance with automatic fallback chain
 */
export class ModelRouter {
  private ollamaBaseUrl: string;
  private grokApiKey?: string;
  private geminiApiKey?: string;
  
  // Model availability cache
  private modelHealth: Map<string, boolean> = new Map();
  private lastHealthCheck: Map<string, number> = new Map();
  private healthCheckInterval = 60000; // 1 minute

  constructor() {
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.grokApiKey = process.env.GROK_API_KEY;
    this.geminiApiKey = process.env.GOOGLE_API_KEY;
  }

  /**
   * Get the optimal model configuration for a task type
   */
  private getModelConfig(taskType: TaskType): ModelConfig[] {
    const configs: Record<TaskType, ModelConfig[]> = {
      strategic: [
        { name: "llama3.2", provider: "ollama", temperature: 0.1, timeout: 60000 },
        { name: "grok-beta", provider: "grok", temperature: 0.1, timeout: 45000 },
        { name: "gemini-1.5-flash", provider: "gemini", temperature: 0.1, timeout: 30000 }
      ],
      creative: [
        { name: "mistral-nemo", provider: "ollama", temperature: 0.7, timeout: 60000 },
        { name: "llama3.2", provider: "ollama", temperature: 0.7, timeout: 60000 },
        { name: "gemini-1.5-flash", provider: "gemini", temperature: 0.7, timeout: 30000 }
      ],
      research: [
        { name: "grok-beta", provider: "grok", temperature: 0.2, timeout: 90000 },
        { name: "llama3.2", provider: "ollama", temperature: 0.2, timeout: 60000 },
        { name: "gemini-1.5-flash", provider: "gemini", temperature: 0.2, timeout: 45000 }
      ],
      validation: [
        { name: "gemini-1.5-flash", provider: "gemini", temperature: 0, timeout: 20000 },
        { name: "llama3.2", provider: "ollama", temperature: 0, timeout: 30000 }
      ],
      embedding: [
        { name: "nomic-embed-text", provider: "ollama", temperature: 0, timeout: 30000 }
      ],
      general: [
        { name: "llama3.2", provider: "ollama", temperature: 0.3, timeout: 60000 },
        { name: "gemini-1.5-flash", provider: "gemini", temperature: 0.3, timeout: 30000 }
      ]
    };

    return configs[taskType] || configs.general;
  }

  /**
   * Check if a model is healthy and available
   */
  private async checkModelHealth(config: ModelConfig): Promise<boolean> {
    const cacheKey = `${config.provider}:${config.name}`;
    const lastCheck = this.lastHealthCheck.get(cacheKey) || 0;
    const now = Date.now();

    // Use cached result if recent
    if (now - lastCheck < this.healthCheckInterval && this.modelHealth.has(cacheKey)) {
      return this.modelHealth.get(cacheKey)!;
    }

    try {
      // Quick health check based on provider
      if (config.provider === "ollama") {
        // Check if Ollama is running
        const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
          signal: AbortSignal.timeout(5000)
        });
        const isHealthy = response.ok;
        this.modelHealth.set(cacheKey, isHealthy);
        this.lastHealthCheck.set(cacheKey, now);
        return isHealthy;
      } else if (config.provider === "grok") {
        // Check if Grok API key is available
        const isHealthy = !!this.grokApiKey && this.grokApiKey !== "";
        this.modelHealth.set(cacheKey, isHealthy);
        this.lastHealthCheck.set(cacheKey, now);
        return isHealthy;
      } else if (config.provider === "gemini") {
        // Check if Gemini API key is available
        const isHealthy = !!this.geminiApiKey && this.geminiApiKey !== "";
        this.modelHealth.set(cacheKey, isHealthy);
        this.lastHealthCheck.set(cacheKey, now);
        return isHealthy;
      }
      
      return false;
    } catch (error) {
      console.warn(`Health check failed for ${cacheKey}:`, error);
      this.modelHealth.set(cacheKey, false);
      this.lastHealthCheck.set(cacheKey, now);
      return false;
    }
  }

  /**
   * Create a chat model instance from configuration
   */
  private createChatModel(config: ModelConfig): BaseChatModel {
    if (config.provider === "ollama") {
      return new ChatOllama({
        baseUrl: this.ollamaBaseUrl,
        model: config.name,
        temperature: config.temperature,
        format: "json", // Enable JSON mode for structured output
      }) as any;
    } else if (config.provider === "grok") {
      // Grok uses OpenAI-compatible API
      // Note: Actual implementation would use OpenAI client with Grok endpoint
      // For now, fallback to Ollama
      console.warn("Grok API not yet implemented, falling back to Ollama");
      return new ChatOllama({
        baseUrl: this.ollamaBaseUrl,
        model: "llama3.2",
        temperature: config.temperature,
        format: "json",
      }) as any;
    } else if (config.provider === "gemini") {
      return new ChatGoogleGenerativeAI({
        apiKey: this.geminiApiKey,
        modelName: config.name,
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens || 2048,
      }) as any;
    }

    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  /**
   * Get the best available model for a task with automatic fallback
   */
  async getModel(taskType: TaskType): Promise<{
    model: BaseChatModel;
    config: ModelConfig;
  }> {
    const configs = this.getModelConfig(taskType);

    for (const config of configs) {
      try {
        const isHealthy = await this.checkModelHealth(config);
        
        if (isHealthy) {
          console.log(`✓ Selected ${config.provider}:${config.name} for ${taskType} task`);
          const model = this.createChatModel(config);
          return { model, config };
        } else {
          console.log(`✗ ${config.provider}:${config.name} unavailable, trying fallback...`);
        }
      } catch (error) {
        console.warn(`Failed to create model ${config.provider}:${config.name}:`, error);
        continue;
      }
    }

    // Ultimate fallback: Ollama llama3.2 without health check
    console.warn(`All preferred models unavailable for ${taskType}, using ultimate fallback`);
    const fallbackConfig: ModelConfig = {
      name: "llama3.2",
      provider: "ollama",
      temperature: 0.3,
      timeout: 60000
    };
    
    return {
      model: this.createChatModel(fallbackConfig),
      config: fallbackConfig
    };
  }

  /**
   * Get embeddings model
   */
  async getEmbeddingsModel(): Promise<Embeddings> {
    try {
      const isHealthy = await this.checkModelHealth({
        name: "nomic-embed-text",
        provider: "ollama",
        temperature: 0
      });

      if (isHealthy) {
        console.log("✓ Using nomic-embed-text for embeddings");
        return new OllamaEmbeddings({
          model: "nomic-embed-text",
          baseUrl: this.ollamaBaseUrl,
        });
      }
    } catch (error) {
      console.warn("nomic-embed-text unavailable, falling back to llama3.2");
    }

    // Fallback to llama3.2 for embeddings
    return new OllamaEmbeddings({
      model: "llama3.2",
      baseUrl: this.ollamaBaseUrl,
    });
  }

  /**
   * Clear health check cache (useful for testing)
   */
  clearHealthCache(): void {
    this.modelHealth.clear();
    this.lastHealthCheck.clear();
  }
}

// Singleton instance
let routerInstance: ModelRouter | null = null;

/**
 * Get the global model router instance
 */
export function getModelRouter(): ModelRouter {
  if (!routerInstance) {
    routerInstance = new ModelRouter();
  }
  return routerInstance;
}
