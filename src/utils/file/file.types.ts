import { FileCategory } from "../../generated/prisma/client.js";

export interface UploadedFile {
  originalname: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
}

export interface SavedFile {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  category: FileCategory;
}
