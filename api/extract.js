import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";
import XLSX from "xlsx";

export async function extractText(file) {

    const extension = (file.originalFilename || "")
    .split(".")
    .pop()
    .toLowerCase();

    // TXT
    if (extension === "txt") {
        return file.buffer.toString("utf8");
    }

    // JSON
    if (extension === "json") {
        return file.buffer.toString("utf8");
    }

    // HTML
    if (extension === "html" || extension === "htm") {
        return file.buffer.toString("utf8");
    }

    // CSV
    if (extension === "csv") {
        return file.buffer.toString("utf8");
    }

    // XML
    if (extension === "xml") {
        return file.buffer.toString("utf8");
    }

    // Markdown
    if (extension === "md") {
        return file.buffer.toString("utf8");
    }

   // PDF
    if (extension === "pdf") {
        return await extractPdf(file.buffer);
    }

    // DOCX
    if (extension === "docx") {
        const result = await mammoth.extractRawText({
            buffer: file.buffer
        });

        return result.value;
    }

    // XLSX
    if (extension === "xlsx" || extension === "xls") {

        const workbook = XLSX.read(file.buffer, {
            type: "buffer"
        });

        let text = "";

        workbook.SheetNames.forEach(sheet => {

            text += XLSX.utils.sheet_to_csv(
                workbook.Sheets[sheet]
            );

            text += "\n";
        });

        return text;
    }

    throw new Error("Unsupported file type.");
}

async function extractPdf(buffer) {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str || "").join(" ") + "\n";
    }

    return text;
}