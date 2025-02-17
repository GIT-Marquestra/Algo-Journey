import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(){
    try {

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Contest" RESTART IDENTITY CASCADE;`);
    console.log("Contest table truncated successfully.");

    return NextResponse.json({ message: "Contest table truncated successfully." });

    } catch (error) {

        console.log(error)
        
    }
}