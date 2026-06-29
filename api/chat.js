import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Only POST requests allowed."
        });
    }

    try {

        const { text } = req.body;

        const apiKey = process.env.GEMINI_API_KEY;

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
                            text: `
You are an AI assistant.

Answer ONLY using the documents below.

If the answer cannot be found, reply exactly:

I couldn't find that information.

${text}
`
                        }
                    ]
                }
            ]

        });

        const result =
            response.candidates?.[0]?.content?.parts?.[0]?.text;

        return res.json({
            summary: result
        });

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });

    }

}