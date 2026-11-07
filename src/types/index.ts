export interface HFModel {
  id: string;
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  createdAt: string;
  pipeline_tag?: string;
}

export interface GGUFFile {
  name: string;
  path: string;
  size: number;
  type: string;
  quantization?: string;
}

export interface HFModelDetails extends HFModel {
  siblings: { rfilename: string }[];
  ggufFiles: GGUFFile[];
  description?: string;
  lastModified?: string;
}
