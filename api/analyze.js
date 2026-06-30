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

        let text = "";

const isImage =
uploadedFile.mimetype.startsWith("image/");

if(!isImage){

    text = await extractText(uploadedFile);

}

        if (!isImage && (!text || text.trim() === "")) {

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

    if (isImage) {

        prompt = `
Analyze this image carefully.

Your job is to understand EVERYTHING visible in the image.

If you recognize any famous person, identify them if you are confident.

If you recognize any landmark, monument, building, logo, artwork, country flag, book cover, movie poster, celebrity, vehicle, animal, food, or object, identify it.

Read every visible piece of text.

Explain what is happening.

Describe the environment.

Describe people's expressions and actions.

If the image contains a graph or chart, explain it.

If it contains handwriting, read it.

If it contains a screenshot, explain what application or website it appears to be.

Never guess.

If uncertain, clearly state you are unsure.

Choose ONE category from:

Biography
History
Science
Research
Technology
Business
Finance
Medicine
Education
Legal
Literature
Government
Personal
Resume
News
Photo
Artwork
Landmark
Screenshot
Document
Animal
Vehicle
Food
Nature
Map
Chart
Other

Choose ONE sentiment:

Positive
Neutral
Negative

Return ONLY valid JSON:

{
  "summary":"A detailed description of everything important visible in the image.",
  "category":"Best matching category",
  "keywords":[
    "keyword1",
    "keyword2",
    "keyword3",
    "keyword4",
    "keyword5",
    "keyword6",
    "keyword7",
    "keyword8",
    "keyword9",
    "keyword10"
  ],
  "sentiment":"Positive, Neutral or Negative"
}
`;

    } else {

        prompt = `
Analyze the following document.

Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use code blocks.
Do NOT explain anything.

Choose ONE category ONLY from this list:

Biography
History
Science
Research
Technology
Business
Finance
Medicine
Education
Legal
Literature
Government
Personal
Resume
News
Other

Choose ONE sentiment ONLY from:

Positive
Neutral
Negative

Return exactly this JSON format:

{
  "summary":"3-5 sentence summary",
  "category":"One category from the list above",
  "keywords":[
    "keyword1",
    "keyword2",
    "keyword3",
    "keyword4",
    "keyword5"
  ],
  "sentiment":"Positive, Neutral or Negative"
}

Document:

${text}
`;

  }

}

        const ai = new GoogleGenAI({
            apiKey
        });

        let contents;

if (isImage) {

    contents = [
        {
            role: "user",
            parts: [
                {
                    text: prompt
                },
                {
                    inlineData: {
                        mimeType: uploadedFile.mimetype,
                        data: uploadedFile.buffer.toString("base64")
                    }
                }
            ]
        }
    ];

} else {

    contents = [
        {
            role: "user",
            parts: [
                {
                    text: prompt
                }
            ]
        }
    ];

}

const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
        responseMimeType: "application/json"
    }
});

        const result = response.candidates?.[0]?.content?.parts?.[0]?.text;
        let cleanResult = result
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

        if (!result) {
            return res.status(500).json({
                error: "Gemini returned an empty response."
            });
        }


        return res.status(200).json({
    summary: cleanResult,
    text: text
});

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: err.message
        });

    }

}
