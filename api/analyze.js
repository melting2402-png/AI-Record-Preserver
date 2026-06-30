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

        const [fields, files] = await new Promise((resolve, reject) => {

            const form = formidable({
                multiples: false
            });

            form.parse(req, (err, fields, files) => {

                if (err) {
                    reject(err);
                } else {
                    resolve([fields, files]);
                }

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

        const text = await extractText(uploadedFile);

        if (!text || text.trim() === "") {
            return res.status(400).json({
                error: "Could not extract text from the uploaded file."
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "GEMINI_API_KEY is missing."
            });
        }

        let prompt = "";

        if (mode === "chat") {

            prompt = `
You are an AI assistant.

Answer ONLY using the document below.

If the answer is not in the document, reply exactly:

I couldn't find that information in the uploaded documents.

Document:
${text}
`;

        } else {

            prompt = `
Analyze the following document.

Return ONLY valid JSON.

Do not use markdown.
Do not use code blocks.
Do not explain anything.

Return exactly:

{
  "summary": "3-5 sentence summary",
  "category": "Research",
  "keywords": [
    "keyword1",
    "keyword2",
    "keyword3",
    "keyword4",
    "keyword5"
  ],
  "sentiment": "Positive"
}

Document:

${text}
`;

        }

        const ai = new GoogleGenAI({
            apiKey
        });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ]
        });

        const result = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!result) {
            return res.status(500).json({
                error: "Gemini returned an empty response."
            });
        }


        return res.status(200).json({
            summary: result,
            text: text
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: err.message
        });

    }

}
