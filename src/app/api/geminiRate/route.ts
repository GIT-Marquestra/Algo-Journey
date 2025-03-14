import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔑 Initialize Gemini Pro with API Key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { formattedMessage } = await req.json();

    if (!formattedMessage) {
      return NextResponse.json({ error: "No project data provided." }, { status: 400 });
    }

    // 📝 Define AI Prompt
    const aiPrompt = `
      Analyze the following GitHub project based on code quality, tech stack, and best practices:

      ${formattedMessage}

      🚀 **Evaluation Criteria:**
      1️⃣ Advance Tech Used, as the user using this tool is a first year undergrad (0-20)
      2️⃣ Knowledge level (0-20)
      3️⃣ Use case of project (0-20)
      4️⃣ Security Practices (0-20)
      5️⃣ Overall Rating (0-20)

      do consider it is built by a first year undergrad who has coded for less than a year 

      also tell them to make a readme.md if not made already in github

      give the rating as Final Rating: <your rating as sum of all ratings>

      **Provide specific feedback and suggestions for improvement. in short, 1 point for each, your whole response should not exceed 7 lines**
    `;

    // 🔥 Send request to Gemini Pro
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(aiPrompt);
    const aiResponse = await result.response;
    const insights = aiResponse.text();

    return NextResponse.json({ success: true, insights });
  } catch (error) {
    console.error("🔥 AI Analysis Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}