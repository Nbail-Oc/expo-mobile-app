import { HFModel, HFModelDetails, GGUFFile } from "@/types";

const BASE_URL = "https://huggingface.co/api";

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const fetchWithErrorHandling = async <T>(url: string, options?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Network connection error", 0);
  }
};

/**
 * Extracts quantization name from GGUF file path
 */
export const getQuantizationType = (filename: string): string => {
  const upper = filename.toUpperCase();
  const match = upper.match(/(Q[2-8]_K(_[SML])?|Q[2-8]_0|Q[2-8]_1|IQ[1-4]_[A-Z_]+|BF16|F16|F32)/);
  return match ? match[0] : "Quantized";
};

/**
 * Estimates RAM requirement in GB based on file size in bytes
 */
export const estimateRequiredRAM = (sizeInBytes: number): number => {
  const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
  // Rule of thumb: File size + 1.5GB overhead for context window and OS
  return Math.ceil(sizeInGB + 1.5);
};

/**
 * Parses parameter size from model ID (e.g. 7B, 1.5B)
 */
export const getParameterSize = (modelId: string): string | null => {
  const match = modelId.match(/(\d+(\.\d+)?)[bB]/);
  return match ? `${match[1]}B` : null;
};

/**
 * Determines speed rating based on parameter size and quantization
 */
export const getSpeedRating = (modelId: string, sizeInBytes: number): "instant" | "fast" | "slow" | "very slow" => {
  const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
  
  if (sizeInGB < 2.0) return "instant";
  if (sizeInGB < 4.5) return "fast";
  if (sizeInGB < 8.0) return "slow";
  return "very slow";
};

/**
 * Formats size in bytes to GB/MB string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const huggingFaceService = {
  /**
   * Fetches models matching filter=gguf and search query
   */
  fetchModels: async (
    search?: string,
    sort: string = "downloads",
    limit: number = 20
  ): Promise<HFModel[]> => {
    let url = `${BASE_URL}/models?filter=gguf&sort=${sort}&direction=-1&limit=${limit}`;
    if (search && search.trim() !== "") {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return fetchWithErrorHandling<HFModel[]>(url);
  },

  /**
   * Fetches detailed information and GGUF files list for a single model repository
   */
  fetchModelDetails: async (modelId: string): Promise<HFModelDetails> => {
    const detailsUrl = `${BASE_URL}/models/${modelId}`;
    const treeUrl = `${BASE_URL}/models/${modelId}/tree/main`;

    // Fetch details and file list concurrently
    const [details, files] = await Promise.all([
      fetchWithErrorHandling<any>(detailsUrl),
      fetchWithErrorHandling<any[]>(treeUrl),
    ]);

    // Filter files for GGUF extensions and map them to GGUFFile type
    const ggufFiles: GGUFFile[] = files
      .filter((file) => file.type === "file" && file.path.endsWith(".gguf"))
      .map((file) => {
        const name = file.path.split("/").pop() || file.path;
        return {
          name,
          path: file.path,
          size: file.size,
          type: file.type,
          quantization: getQuantizationType(name),
        };
      })
      .sort((a, b) => a.size - b.size); // Sort from smallest to largest

    return {
      ...details,
      ggufFiles,
    };
  },
};
