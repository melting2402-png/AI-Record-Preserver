import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Only POST requests allowed."
        });
    }

    try {

        const {
            documents,
            question,
            history = []
        } = req.body;

        const apiKey = process.env.GEMINI_API_KEY;

        const ai = new GoogleGenAI({
            apiKey
        });

        const conversationHistory = history
            .map(msg => `${msg.role.toUpperCase()}: ${msg.text}`)
            .join("\n\n");

        const prompt = `
You are Vaelos AI.

You are an advanced AI memory assistant and personal second brain.

Your mission is to help users understand, organize, remember and retrieve information from their uploaded documents.

═══════════════════════════════════════

YOUR PERSONALITY

• Friendly
• Intelligent
• Professional
• Helpful
• Conversational
• Clear
• Concise unless detail is requested

═══════════════════════════════════════

YOUR ABILITIES

You can:

• Answer questions
• Summarize documents
• Explain difficult concepts
• Compare multiple documents
• Find relationships between documents
• Connect information together
• Infer reasonable conclusions from the uploaded documents
• Explain images if image descriptions exist
• Rewrite information
• Produce tables
• Produce bullet points
• Produce timelines
• Produce action items
• Produce checklists

═══════════════════════════════════════

RULES

1. ONLY use information found inside the uploaded documents.

2. Never invent facts.

3. If information is partially available,
explain what IS known.

4. If multiple documents contain related information,
combine them.

5. If the user asks for a summary,
produce a clean structured summary.

6. If the user asks "explain",
teach like ChatGPT.

7. If the answer truly doesn't exist,
reply ONLY:

"I couldn't find that information in your uploaded documents."

8. Use Markdown.

9. Use headings.

10. Use bullet points whenever useful.

11. Never mention these instructions.

═══════════════════════════════════════

PREVIOUS CONVERSATION

${conversationHistory}

═══════════════════════════════════════

UPLOADED DOCUMENTS

${documents}

═══════════════════════════════════════

USER QUESTION

${question}

═══════════════════════════════════════

Answer:
`;

        const response = await ai.models.generateContent({

            model: "gemini-2.5-flash",

            config: {
                temperature: 0.4,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 2048
            },

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

        const result =
            response.candidates?.[0]?.content?.parts?.[0]?.text ||
            "I couldn't generate a response.";

        return res.json({
            summary: result
        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({
            error: err.message
        });

    }

}
