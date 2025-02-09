
import prisma from "@/lib/prisma";
import { AuthOptions } from "next-auth";
import bcrypt from "bcrypt";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) return null;

        // Find user by username
        const user = await prisma.user.findFirst({
          where: { username: credentials.username }
        });

        if (!user) return null;
        // Compare password with hashed password in DB
        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) return null;
        return user;
      }
    })
  ],
  pages: {
    signIn: "/auth/signin"
  },
  callbacks: {
    async session({ session }) {
      // Attach userId to session
      const dbUser = await prisma.user.findUnique({
        where: { username: session.user?.name || "" }
      });

      if (dbUser) {
        //@ts-expect-error : it important here
        session.user.id = dbUser.id; // Store userId in session
      }

      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET // Ensure you have this in .env
};