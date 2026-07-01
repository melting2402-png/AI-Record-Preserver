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

const isImage = uploadedFile.mimetype.startsWith("image/");
const isAudio = uploadedFile.mimetype.startsWith("audio/");
const isVideo = uploadedFile.mimetype.startsWith("video/");

if (!isImage && !isAudio && !isVideo) {
    text = await extractText(uploadedFile);
}

        if (!isImage && !isAudio && !isVideo &&
    (!text || text.trim() === "")) {

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

    if (isImage || isAudio || isVideo) {

        prompt = `
Analyze this image carefully.

Your job is to understand EVERYTHING visible in the image.

Identify:

- Any famous public figure (politician, actor, athlete, scientist, musician, historical figure, influencer, etc.) if you are highly confident.
- Any famous landmark, monument, building, logo, company, flag, artwork, book cover, movie poster, sports team logo, or brand if you are highly confident.
- Any animals, vehicles, foods, plants, products, electronic devices, maps, charts, graphs, or objects that are clearly visible.
- Any visible text exactly as written.
- Whether the image is a photograph, screenshot, scanned document, drawing, painting, meme, infographic, or chart.

Describe:

- What is happening in the image.
- The surroundings or environment.
- People's clothing, expressions, posture, and actions.
- Important colors, objects, and relationships.
- Any important events or activities taking place.

If the image is a screenshot, explain what application, website, or interface it appears to show.

If the image contains a graph or chart, explain what the data represents.

If the image contains handwriting, read it if it is legible.

If you are not highly confident about an identity or object, DO NOT guess. Instead, describe what you can see.

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

Choose ONE sentiment ONLY from:

Positive
Neutral
Negative

Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use code blocks.
Do NOT include any text before or after the JSON.

Return exactly this format:

{
  "summary":"A detailed 4-6 sentence description of everything important in the image.",
  "category":"One category from the list above",
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

if (isImage || isAudio || isVideo) {

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
