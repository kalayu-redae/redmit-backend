import fs from "fs/promises";
import path from "path";
import { prisma } from "../../config/prisma.js";
import { FILE_BASE_URL, FILE_DIRECTORIES, } from "./file.config.js";
import { deletePhysicalFile, getFileCategory, } from "./file.utils.js";
class FileManager {
    async upload(file, isPublic = true) {
        const category = getFileCategory(file.mimetype);
        const filename = file.filename;
        const sourcePath = file.path;
        const targetDirectory = FILE_DIRECTORIES[category];
        await fs.mkdir(targetDirectory, {
            recursive: true,
        });
        const targetPath = path.join(targetDirectory, filename);
        if (sourcePath !== targetPath) {
            await fs.rename(sourcePath, targetPath);
        }
        const relativePath = path
            .relative(process.cwd(), targetPath)
            .replace(/\\/g, "/");
        const url = `${FILE_BASE_URL}/${relativePath}`;
        const savedFile = await prisma.file.create({
            data: {
                originalName: file.originalname,
                filename,
                path: relativePath,
                url,
                mimeType: file.mimetype,
                size: file.size,
                category,
                isPublic,
            },
        });
        return savedFile;
    }
    async uploadMany(files, isPublic = true) {
        const savedFiles = [];
        for (const file of files) {
            const savedFile = await this.upload(file, isPublic);
            savedFiles.push(savedFile);
        }
        return savedFiles;
    }
    async get(id) {
        return prisma.file.findUnique({
            where: { id },
        });
    }
    async getMany(ids) {
        return prisma.file.findMany({
            where: {
                id: {
                    in: ids,
                },
            },
        });
    }
    async delete(id) {
        const file = await prisma.file.findUnique({
            where: { id },
        });
        if (!file) {
            return null;
        }
        const physicalPath = path.join(process.cwd(), file.path);
        await deletePhysicalFile(physicalPath);
        await prisma.file.delete({
            where: { id },
        });
        return file;
    }
    async deleteMany(ids) {
        const files = await this.getMany(ids);
        for (const file of files) {
            const physicalPath = path.join(process.cwd(), file.path);
            await deletePhysicalFile(physicalPath);
        }
        if (files.length > 0) {
            await prisma.file.deleteMany({
                where: {
                    id: {
                        in: files.map((file) => file.id),
                    },
                },
            });
        }
        return files;
    }
    async deleteAll() {
        const files = await prisma.file.findMany();
        for (const file of files) {
            const physicalPath = path.join(process.cwd(), file.path);
            await deletePhysicalFile(physicalPath);
        }
        await prisma.file.deleteMany();
        return files;
    }
}
export default new FileManager();
