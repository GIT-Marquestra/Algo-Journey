import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { tags } = await req.json();

        if (!Array.isArray(tags) || tags.some(tag => typeof tag !== "string")) {
            return NextResponse.json({ error: "Invalid input format" }, { status: 400 });
        }

        const existingTags = await prisma.questionTag.findMany({
            select: { name: true }
        });

        const existingTagNames = new Set(existingTags.map(tag => tag.name));
        const incomingTagNames = new Set(tags);

        const tagsToRemove = [...existingTagNames].filter(tag => !incomingTagNames.has(tag));

        const tagsToAdd = [...incomingTagNames].filter(tag => !existingTagNames.has(tag)).map(tag => ({ name: tag }));

        await prisma.$transaction([
            prisma.questionTag.deleteMany({
                where: { name: { in: tagsToRemove } }
            }),
            prisma.questionTag.createMany({
                data: tagsToAdd
            })
        ]);

        return NextResponse.json({ message: "Tags updated successfully" });
    } catch (error) {
        console.error("Error updating tags:", error);
        return NextResponse.json({ error: "Failed to update tags" }, { status: 500 });
    }
}


