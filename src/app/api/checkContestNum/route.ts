import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const lastContestNum = await prisma.contest.findFirst({
            orderBy: {
                createdAt: "desc"
            }
        });

        if (!lastContestNum) {
            return NextResponse.json({ error: "No contests found" }, { status: 404 });
        }

        return NextResponse.json({ id: lastContestNum.id }, { status: 200 });

    } catch (error) {
        console.error("Error fetching last contest number:", error);
        return NextResponse.json({ error: "Error fetching last contest number" }, { status: 400 });
    }
}