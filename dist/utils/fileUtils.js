const fs = require('fs');
const fss = require('fs').promises; // Use fs.promises for async file reading
const path = require('path');
const fsp = require('fs').promises;
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { sequelize } = require('../models'); // adjust path
const multer = require('multer');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');
exports.createMulterMiddleware = (destinationFolder, filenamePrefix, allowedTypes = [], maxFileSizeMB = 5) => {
    if (!fs.existsSync(destinationFolder)) {
        fs.mkdirSync(destinationFolder, { recursive: true });
    }
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, destinationFolder);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const name = path
                .basename(file.originalname, ext)
                .replace(/\s+/g, '-')
                .replace(/[^a-zA-Z0-9-_]/g, '')
                .toLowerCase()
                .slice(0, 80) || 'file';
            const uniqueName = `${filenamePrefix}-${name}-${Date.now()}${ext}`;
            cb(null, uniqueName);
        }
    });
    const fileFilter = (req, file, cb) => {
        if (!allowedTypes.length || allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new AppError(`Unsupported file type: ${file.mimetype}`, 400), false);
        }
    };
    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxFileSizeMB * 1024 * 1024
        }
    });
};
exports.extractFiles = (req, folder = '') => {
    const files = req.files || {};
    const normalizedFolder = String(folder || '').replace(/^\/+|\/+$/g, '');
    const folderPrefix = normalizedFolder ? `${normalizedFolder}/` : '';
    const getSingle = (field) => files[field]?.[0] ? `/uploads/${folderPrefix}${files[field][0].filename}` : null;
    const getMultiple = (field) => (files[field] || []).map(file => ({
        fileName: file.filename,
        fileType: file.mimetype,
        path: `/uploads/${folderPrefix}${file.filename}`
    }));
    return {
        single: getSingle,
        multiple: getMultiple
    };
};
exports.processUploadFilesToSave = async (req, files = {}, body = {}, existingModel = null, folder = '') => {
    const normalizedFolder = String(folder || '').replace(/^\/+|\/+$/g, '');
    const uploadsBase = normalizedFolder ? `uploads/${normalizedFolder}` : 'uploads';
    const baseUrl = `${req.protocol}://${req.get('host')}/${uploadsBase}/`;
    /* ---------- PROFILE IMAGE (SINGLE) ---------- */
    let profileImage = existingModel?.profileImage || null;
    if (files.profileImage?.length) {
        profileImage = `${baseUrl}${files.profileImage[0].filename}`;
    }
    /* ---------- IMAGES (MULTIPLE) ---------- */
    const newImages = (files.images || []).map(file => ({
        fileName: file.filename,
        fileType: file.mimetype,
        url: `${baseUrl}${file.filename}`,
        uploadedAt: new Date()
    }));
    const images = existingModel
        ? [...(existingModel.images || []), ...newImages]
        : newImages;
    /* ---------- DOCUMENTS (MULTIPLE) ---------- */
    const newDocuments = (files.documents || []).map(file => ({
        fileName: file.filename,
        fileType: file.mimetype,
        url: `${baseUrl}${file.filename}`,
        uploadedAt: new Date()
    }));
    const documents = existingModel
        ? [...(existingModel.documents || []), ...newDocuments]
        : newDocuments;
    /* ---------- DEFAULT PROFILE IMAGE ---------- */
    if (!profileImage) {
        profileImage = `${req.protocol}://${req.get('host')}/uploads/default.png`;
    }
    return {
        profileImage,
        images,
        documents
    };
};
exports.deleteFile = async (fileUrl) => {
    if (!fileUrl)
        return;
    try {
        const relativePath = fileUrl.split('/uploads/')[1];
        if (!relativePath)
            return;
        const absolutePath = path.join(__dirname, '..', 'uploads', relativePath);
        await fsp.access(absolutePath);
        await fsp.unlink(absolutePath);
    }
    catch (err) {
        console.warn('File delete skipped:', err.message);
    }
};
exports.deleteMultipleFiles = async (fileArray = []) => {
    if (!Array.isArray(fileArray))
        return;
    for (const file of fileArray) {
        if (file?.url) {
            await exports.deleteFile(file.url);
        }
    }
};
exports.mapImportRows = (rows, mapFn) => {
    return rows.map((row, index) => {
        try {
            return mapFn(row);
        }
        catch (error) {
            throw new Error(`Error processing row ${index + 1}: ${error.message}`);
        }
    });
};
exports.importFromExcelFile = async ({ filePath, requiredFields = [], transformFn = null, saveFn }) => {
    if (!filePath || !fs.existsSync(filePath)) {
        throw new AppError('Excel file not found', 400);
    }
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    // console.log("json data",jsonData)
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new AppError('Excel file is empty or data is not in correct format', 400);
    }
    const importedData = [];
    const errors = [];
    for (const [index, row] of jsonData.entries()) {
        console.log("row", row);
        try {
            // Check for missing required fields
            console.log("required fields", requiredFields);
            const missingFields = requiredFields.filter(f => !row[f]);
            if (missingFields.length > 0) {
                throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400);
            }
            console.log("missing fields", missingFields.length);
            // Transform row if a transform function is provided
            let transformed = transformFn ? await transformFn(row) : row;
            // Save using provided save function
            const saved = await saveFn(transformed);
            importedData.push(saved);
        }
        catch (err) {
            errors.push({ row: index + 2, error: err.message, data: row }); // +2 for Excel header
        }
    }
    fs.unlinkSync(filePath);
    console.log("imported Data file util", importedData);
    return { importedData, errors };
};
exports.exportToExcelFile = async ({ data, columns, fileName, res }) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.columns = columns;
    data.forEach(row => worksheet.addRow(row));
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}-${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
};
exports.readExcelFile = catchAsync(async (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    return jsonData;
});
export {};
