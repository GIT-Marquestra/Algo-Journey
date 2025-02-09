import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma'; 
import bcrypt from 'bcrypt'
export async function POST(req: Request) {
  const request = await req.json()
  const hashedPssword = await bcrypt.hash(request.password, 10)
  if(!req.body){
    return 
  }
  if(!(request.username)){
    return NextResponse.json({ error: "User creation failed" }, { status: 400 });
  }
  console.log(12)

  console.log(request.username, request.email, hashedPssword, request.leetcodeUsername, request.codeforcesUsername, request.section)

  try {
    const user = await prisma.user.create({
      data: {
        username: request.username,
        email: request.email,
        password: hashedPssword,
        leetcodeUsername: request.leetcodeUsername,
        codeforcesUsername: request.codeforcesUsername,
        enrollmentNum: request.enrollmentNum,
        section: request.section
      }
    });
    console.log('user: ', user)
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: "User creation failed" }, { status: 400 });
  }
}
