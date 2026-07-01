import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Only POST allowed"
        });
    }

    try {

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        const uploadUrl = await ai.files.createUploadUrl();

        res.status(200).json(uploadUrl);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

}
