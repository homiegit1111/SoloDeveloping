import { NextRequest, NextResponse } from "next/server";
import { chunkText, slugify, inferCategories } from "@/lib/chunk";
import { BookMeta, BookChunk } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Accepts a multipart/form-data POST with a `file` (PDF).
// Parses it server-side with pdf-parse, chunks + tags it, and returns
// { meta, chunks } for the client to store in localStorage.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded (field 'file')." }, { status: 400 });
    }

    const arrayBuf = await (file as File).arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    // pdf-parse is CommonJS and server-only.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdf = require("pdf-parse");
    const parsed = await pdf(buffer);
    const text: string = parsed.text || "";
    const pages: number = parsed.numpages || 0;

    if (text.trim().length < 200) {
      return NextResponse.json(
        { error: "Could not extract text — this PDF may be scanned images (needs OCR)." },
        { status: 422 }
      );
    }

    const name = (file as File).name || "uploaded-book.pdf";
    const slug = slugify(name) || `book-${Date.now()}`;
    const chunks: BookChunk[] = chunkText(slug, text);
    const categories = inferCategories(chunks);

    const meta: BookMeta = {
      slug,
      title: name.replace(/\.pdf$/i, ""),
      author: "Uploaded",
      categories,
      pages: pages || Math.ceil(text.split(/\s+/).length / 350),
      chunkCount: chunks.length,
      preloaded: false,
      active: true,
    };

    return NextResponse.json({ meta, chunks });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to process PDF" }, { status: 500 });
  }
}
