import multer from "multer";

const storage = multer.memoryStorage();

export const uploadResume = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error("Resume must be a PDF, Word document, or text file"));
      return;
    }

    cb(null, true);
  },
});
