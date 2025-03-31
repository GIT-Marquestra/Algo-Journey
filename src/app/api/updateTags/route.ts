import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { tags } = await req.json();

        if (!Array.isArray(tags) || tags.some(tag => typeof tag !== "string")) {
            return NextResponse.json({ error: "Invalid input format" }, { status: 400 });
        }


        const existingTags = await prisma.questionTag.findMany({
            where: { name: { in: tags } },
            select: { name: true }
        });

        const existingTagNames = new Set(existingTags.map(tag => tag.name));
        

        const newTags = tags
            .filter(tag => !existingTagNames.has(tag))
            .map(tag => ({ name: tag }));

        if (newTags.length > 0) {
            await prisma.$transaction([
                prisma.questionTag.createMany({ data: newTags })
            ]);
        }

        return NextResponse.json({ message: "Tags updated successfully" });
    } catch (error) {
        console.error("Error updating tags:", error);
        return NextResponse.json({ error: "Failed to update tags" }, { status: 500 });
    }
}