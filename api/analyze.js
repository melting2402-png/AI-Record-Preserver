import formidable from "formidable";
import fs from "fs";
import { extractText } from "./extract.js";
import { GoogleGenAI } from "@google/genai";

export const config = {
    api: {
        bodyParser: false
    }
};

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Only POST requests are allowed."
        });
    }

    try {

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "GEMINI_API_KEY is missing."
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        const [fields, files] = await new Promise((resolve, reject) => {

            const form = formidable({ multiples: false });

            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                else resolve([fields, files]);
            });

        });

        const mode = fields.mode?.[0];
        const uploadedFile = files.file?.[0];

        if (!uploadedFile) {
            return res.status(400).json({
                error: "No file was uploaded."
            });
        }

        uploadedFile.buffer = fs.readFileSync(uploadedFile.filepath);

        const mimeType = uploadedFile.mimetype;

        let extractedText = "";

        // =========================
        // IMAGE HANDLING
        // =========================
        if (mimeType.startsWith("image/")) {

            const prompt = mode === "chat"
                ? "Answer questions about this image."
                : "Analyze this image and summarize it.";

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType,
                                    data: uploadedFile.buffer.toString("base64")
                                }
                            }
                        ]
                    }
                ]
            });

            extractedText = response.text || "";

        }

        // =========================
        // TEXT / PDF / DOC HANDLING
        // =========================
        else {

            extractedText = await extractText(uploadedFile);

            if (!extractedText || extractedText.trim() === "") {
                return res.status(400).json({
                    error: "Could not extract text from file."
                });
            }
        }

        // =========================
        // FINAL PROMPT
        // =========================
        let prompt;

        if (mode === "chat") {

            prompt = `
You are an AI assistant.

Answer ONLY using the content below.

If answer is not present, say:
"I couldn't find that information in the uploaded document."

CONTENT:
${extractedText}
`;

        } else {

            prompt = `
Analyze the following content.

Return ONLY valid JSON:

{
  "summary": "3-5 sentence summary",
  "category": "Research",
  "keywords": ["k1","k2","k3","k4","k5"],
  "sentiment": "Positive"
}

CONTENT:
${extractedText}
`;
        }

        // =========================
        // FINAL AI CALL
        // =========================
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        const result = response.text;

        if (!result) {
            return res.status(500).json({
                error: "Gemini returned an empty response."
            });
        }

        return res.status(200).json({
            summary: result,
            text: extractedText
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: err.message
        });
    }
}
