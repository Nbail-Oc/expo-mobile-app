import { create } from "zustand";
import * as FileSystem from "expo-file-system/legacy";

export interface InstalledModel {
  id: string;
  fileName: string;
  size: number;
  path: string;
  downloadedAt: string;
}

export interface DownloadState {
  progress: number; // 0 to 100
  isPaused: boolean;
  fileName: string;
  totalBytes: number;
}

interface ModelStore {
  installedModels: Record<string, InstalledModel>;
  activeDownloads: Record<string, DownloadState>;
  initialized: boolean;
  
  // Actions
  initializeStore: () => Promise<void>;
  startDownload: (modelId: string, fileName: string) => Promise<void>;
  pauseDownload: (modelId: string) => Promise<void>;
  resumeDownload: (modelId: string) => Promise<void>;
  cancelDownload: (modelId: string) => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
}

// Local references to active resumable download objects (keeps store serializable)
const activeDownloadsMap: Record<string, FileSystem.DownloadResumable> = {};

const METADATA_FILE = FileSystem.documentDirectory + "models_metadata.json";
const MODELS_DIR = FileSystem.documentDirectory + "models/";

// Save metadata helper
const saveMetadata = async (models: Record<string, InstalledModel>) => {
  try {
    await FileSystem.writeAsStringAsync(METADATA_FILE, JSON.stringify(models));
  } catch (error) {
    console.error("Failed to save model metadata:", error);
  }
};

export const useModelStore = create<ModelStore>((set, get) => ({
  installedModels: {},
  activeDownloads: {},
  initialized: false,

  initializeStore: async () => {
    try {
      // Ensure models directory exists
      const dirInfo = await FileSystem.getInfoAsync(MODELS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
      }

      // Load metadata file
      const metaInfo = await FileSystem.getInfoAsync(METADATA_FILE);
      if (metaInfo.exists) {
        const content = await FileSystem.readAsStringAsync(METADATA_FILE);
        const parsed: Record<string, InstalledModel> = JSON.parse(content);
        
        // Validate that each model file still exists on disk
        const validated: Record<string, InstalledModel> = {};
        for (const [id, model] of Object.entries(parsed)) {
          const fileInfo = await FileSystem.getInfoAsync(model.path);
          if (fileInfo.exists) {
            validated[id] = model;
          }
        }

        // If some files were missing, update metadata file
        if (Object.keys(validated).length !== Object.keys(parsed).length) {
          await saveMetadata(validated);
        }

        set({ installedModels: validated, initialized: true });
      } else {
        set({ installedModels: {}, initialized: true });
      }
    } catch (error) {
      console.error("Failed to initialize model store:", error);
      set({ installedModels: {}, initialized: true });
    }
  },

  startDownload: async (modelId: string, fileName: string) => {
    // Check if already downloading
    if (get().activeDownloads[modelId]) return;

    // Check if already installed
    if (get().installedModels[modelId]) return;

    const fileUri = MODELS_DIR + fileName;
    const url = `https://huggingface.co/${modelId}/resolve/main/${fileName}`;

    // Ensure models directory exists
    const dirInfo = await FileSystem.getInfoAsync(MODELS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
    }

    // Set initial download state in store
    set((state) => ({
      activeDownloads: {
        ...state.activeDownloads,
        [modelId]: { progress: 0, isPaused: false, fileName, totalBytes: 0 },
      },
    }));

    // Create resumable download
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      (downloadProgress) => {
        const ratio = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        const progressPercentage = Math.round(ratio * 100);
        
        set((state) => {
          const current = state.activeDownloads[modelId];
          if (!current) return state; // download was cancelled
          return {
            activeDownloads: {
              ...state.activeDownloads,
              [modelId]: {
                ...current,
                progress: progressPercentage,
                totalBytes: downloadProgress.totalBytesExpectedToWrite,
              },
            },
          };
        });
      }
    );

    activeDownloadsMap[modelId] = downloadResumable;

    try {
      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        // Download complete! Get size via getInfoAsync since it's not on FileSystemDownloadResult
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        const fileSize = fileInfo.exists ? fileInfo.size : 0;

        const installed: InstalledModel = {
          id: modelId,
          fileName,
          size: fileSize,
          path: result.uri,
          downloadedAt: new Date().toISOString(),
        };

        set((state) => {
          const updatedActive = { ...state.activeDownloads };
          delete updatedActive[modelId];
          
          const updatedInstalled = {
            ...state.installedModels,
            [modelId]: installed,
          };

          // Save new metadata
          saveMetadata(updatedInstalled);

          return {
            activeDownloads: updatedActive,
            installedModels: updatedInstalled,
          };
        });

        delete activeDownloadsMap[modelId];
      }
    } catch (error) {
      // Don't log if it was manually paused or cancelled
      const activeState = get().activeDownloads[modelId];
      if (activeState && !activeState.isPaused) {
        console.error(`Download failed for model ${modelId}:`, error);
        
        // Remove from active downloads list on unexpected error
        set((state) => {
          const updatedActive = { ...state.activeDownloads };
          delete updatedActive[modelId];
          return { activeDownloads: updatedActive };
        });
        delete activeDownloadsMap[modelId];
      }
    }
  },

  pauseDownload: async (modelId: string) => {
    const download = activeDownloadsMap[modelId];
    if (!download) return;

    try {
      await download.pauseAsync();
      
      set((state) => {
        const current = state.activeDownloads[modelId];
        if (!current) return state;
        return {
          activeDownloads: {
            ...state.activeDownloads,
            [modelId]: { ...current, isPaused: true },
          },
        };
      });
    } catch (error) {
      console.error("Failed to pause download:", error);
    }
  },

  resumeDownload: async (modelId: string) => {
    const download = activeDownloadsMap[modelId];
    if (!download) return;

    set((state) => {
      const current = state.activeDownloads[modelId];
      if (!current) return state;
      return {
        activeDownloads: {
          ...state.activeDownloads,
          [modelId]: { ...current, isPaused: false },
        },
      };
    });

    try {
      const result = await download.resumeAsync();
      
      if (result) {
        // Resumed download completed! Get size via getInfoAsync
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        const fileSize = fileInfo.exists ? fileInfo.size : 0;

        const installed: InstalledModel = {
          id: modelId,
          fileName: get().activeDownloads[modelId]?.fileName || download.savable().url.split("/").pop() || "",
          size: fileSize,
          path: result.uri,
          downloadedAt: new Date().toISOString(),
        };

        set((state) => {
          const updatedActive = { ...state.activeDownloads };
          delete updatedActive[modelId];
          
          const updatedInstalled = {
            ...state.installedModels,
            [modelId]: installed,
          };

          saveMetadata(updatedInstalled);

          return {
            activeDownloads: updatedActive,
            installedModels: updatedInstalled,
          };
        });

        delete activeDownloadsMap[modelId];
      }
    } catch (error) {
      const activeState = get().activeDownloads[modelId];
      if (activeState && !activeState.isPaused) {
        console.error("Error resuming download:", error);
        set((state) => {
          const updatedActive = { ...state.activeDownloads };
          delete updatedActive[modelId];
          return { activeDownloads: updatedActive };
        });
        delete activeDownloadsMap[modelId];
      }
    }
  },

  cancelDownload: async (modelId: string) => {
    const download = activeDownloadsMap[modelId];
    const activeState = get().activeDownloads[modelId];
    if (!download || !activeState) return;

    try {
      await download.cancelAsync();
    } catch (error) {
      console.error("Failed to cancel download task:", error);
    }

    // Clean up local reference and state
    delete activeDownloadsMap[modelId];
    
    set((state) => {
      const updatedActive = { ...state.activeDownloads };
      delete updatedActive[modelId];
      return { activeDownloads: updatedActive };
    });

    // Clean up temporary download file if left behind
    const fileUri = MODELS_DIR + activeState.fileName;
    try {
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    } catch (e) {
      console.warn("Failed to clean up temp file during cancel:", e);
    }
  },

  deleteModel: async (modelId: string) => {
    const model = get().installedModels[modelId];
    if (!model) return;

    try {
      const fileInfo = await FileSystem.getInfoAsync(model.path);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(model.path, { idempotent: true });
      }
    } catch (error) {
      console.error("Failed to delete model file:", error);
    }

    set((state) => {
      const updatedInstalled = { ...state.installedModels };
      delete updatedInstalled[modelId];
      
      saveMetadata(updatedInstalled);

      return {
        installedModels: updatedInstalled,
      };
    });
  },
}));
