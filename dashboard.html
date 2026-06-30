import formidable from "formidable";
import fs from "fs";
import { extractText } from "./extract.js";
import { GoogleGenAI } from "@google/genai";

export const config = {
    api: {
        bodyParser: false
    }
};

// 🔥 SAFE JSON EXTRACTOR (fixes your error)
function extractJSON(text) {
    if (!text) return null;

    // remove markdown garbage
    const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    // extract first JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
        return JSON.parse(match[0]);
    } catch (err) {
        console.error("JSON parse failed:", err.message);
        return null;
    }
}

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

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: mode === "chat"
                                    ? "Answer questions about this image."
                                    : "Analyze this image and return ONLY JSON."
                            },
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
        // PROMPT
        // =========================
        let prompt;

        if (mode === "chat") {

            prompt = `
You are an AI assistant.

Answer ONLY using the content below.

CONTENT:
${extractedText}
`;

        } else {

            prompt = `
Return ONLY valid JSON.

Do NOT use markdown or code blocks.

Format:
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

        const resultText = response.text;

        if (!resultText) {
            return res.status(500).json({
                error: "Gemini returned empty response."
            });
        }

        // =========================
        // SAFE JSON PARSE
        // =========================
        let finalResult = resultText;

        if (mode !== "chat") {
            const parsed = extractJSON(resultText);

            if (!parsed) {
                return res.status(500).json({
                    error: "Failed to parse AI JSON response",
                    raw: resultText
                });
            }

            finalResult = parsed;
        }

        return res.status(200).json({
            result: finalResult,
            text: extractedText
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: err.message
        });
    }
}
