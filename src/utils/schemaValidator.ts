import { z } from "zod";
import { getModelRouter } from "../llm/modelRouter";
import { HumanMessage } from "@langchain/core/messages";

/**
 * Validation result interface
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  repaired?: boolean;
  attempts?: number;
}

/**
 * Schema Validator - Validates and repairs JSON outputs
 * Uses Gemini for lightweight validation and auto-repair
 */
export class SchemaValidator {
  private maxRetries = 2;
  private router = getModelRouter();

  /**
   * Validate data against a Zod schema
   */
  async validate<T>(
    data: any,
    schema: z.ZodType<T>,
    options: {
      autoRepair?: boolean;
      context?: string;
    } = {}
  ): Promise<ValidationResult<T>> {
    const { autoRepair = true, context = "" } = options;

    try {
      // First attempt: Direct validation
      const validated = schema.parse(data);
      return {
        success: true,
        data: validated,
        attempts: 1
      };
    } catch (error: any) {
      console.warn("Initial validation failed:", error.message);

      if (!autoRepair) {
        return {
          success: false,
          error: error.message,
          attempts: 1
        };
      }

      // Attempt auto-repair
      return await this.repairAndValidate(data, schema, error.message, context);
    }
  }

  /**
   * Repair malformed JSON and validate
   */
  private async repairAndValidate<T>(
    data: any,
    schema: z.ZodType<T>,
    validationError: string,
    context: string
  ): Promise<ValidationResult<T>> {
    console.log("Attempting JSON repair with validator agent...");

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { model } = await this.router.getModel("validation");

        const repairPrompt = `You are a JSON repair specialist. Your task is to fix malformed JSON data to match a specific schema.

ORIGINAL DATA (may be malformed):
${JSON.stringify(data, null, 2)}

VALIDATION ERROR:
${validationError}

${context ? `CONTEXT:\n${context}\n` : ""}

INSTRUCTIONS:
1. Analyze the validation error
2. Fix the JSON structure to match the expected schema
3. Ensure all required fields are present
4. Use reasonable defaults for missing optional fields
5. Maintain the original intent and data where possible
6. Return ONLY the repaired JSON object, no explanations

CRITICAL: Respond with ONLY valid JSON, no markdown, no code blocks, no additional text.`;

        const response = await model.invoke([new HumanMessage(repairPrompt)]);
        const content = typeof response.content === 'string' 
          ? response.content 
          : JSON.stringify(response.content);

        // Clean up response
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const repairedData = JSON.parse(jsonStr);
        
        // Validate repaired data
        const validated = schema.parse(repairedData);
        
        console.log(`✓ JSON repaired successfully on attempt ${attempt}`);
        return {
          success: true,
          data: validated,
          repaired: true,
          attempts: attempt + 1
        };
      } catch (error: any) {
        console.warn(`Repair attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          return {
            success: false,
            error: `Failed to repair JSON after ${this.maxRetries} attempts: ${error.message}`,
            attempts: attempt + 1
          };
        }
      }
    }

    return {
      success: false,
      error: "Unexpected error in repair process",
      attempts: this.maxRetries + 1
    };
  }

  /**
   * Safe JSON parse with error handling
   */
  safeJsonParse(jsonString: string): { success: boolean; data?: any; error?: string } {
    try {
      // Clean common JSON formatting issues
      let cleaned = jsonString.trim();
      
      // Remove markdown code blocks
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Remove leading/trailing whitespace
      cleaned = cleaned.trim();

      // Parse
      const data = JSON.parse(cleaned);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract JSON from text that may contain additional content
   */
  extractJson(text: string): { success: boolean; data?: any; error?: string } {
    try {
      // Try to find JSON object in text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return this.safeJsonParse(jsonMatch[0]);
      }

      // Try to find JSON array in text
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return this.safeJsonParse(arrayMatch[0]);
      }

      return { success: false, error: "No JSON found in text" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate with automatic JSON extraction and repair
   */
  async validateFromString<T>(
    jsonString: string,
    schema: z.ZodType<T>,
    options: {
      autoRepair?: boolean;
      context?: string;
    } = {}
  ): Promise<ValidationResult<T>> {
    // First, try to parse the JSON
    const parseResult = this.safeJsonParse(jsonString);
    
    if (!parseResult.success) {
      // Try to extract JSON from text
      const extractResult = this.extractJson(jsonString);
      
      if (!extractResult.success) {
        return {
          success: false,
          error: `Failed to parse JSON: ${parseResult.error}`,
          attempts: 1
        };
      }
      
      // Validate extracted JSON
      return await this.validate(extractResult.data, schema, options);
    }

    // Validate parsed JSON
    return await this.validate(parseResult.data, schema, options);
  }
}

// Singleton instance
let validatorInstance: SchemaValidator | null = null;

/**
 * Get the global schema validator instance
 */
export function getSchemaValidator(): SchemaValidator {
  if (!validatorInstance) {
    validatorInstance = new SchemaValidator();
  }
  return validatorInstance;
}
