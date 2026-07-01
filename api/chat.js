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
You are Vaelos AI, an intelligent document assistant.

Your job is to answer questions ONLY from the user's uploaded documents.

Rules:

- Carefully read ALL provided documents before answering.
- You may summarize, explain, infer and connect information across multiple documents.
- Answer naturally like ChatGPT.
- If the user asks about an image, use the image description stored in the document as evidence.
- If the answer is partially available, answer with what you know.
- Only say "I couldn't find that information in your uploaded documents." if the information truly does not exist.

Documents:

${text}
`
                }
            ]
        }
    ]

});
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
