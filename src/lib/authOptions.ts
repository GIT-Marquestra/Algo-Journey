import prisma from "@/lib/prisma";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        return { 
          id: profile.sub, 
          email: profile.email, 
          name: profile.name 
        };
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const user = await prisma.user.findFirst({
          where: { username: credentials.username }
        });

        if (!user) return null;

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
      const dbUser = await prisma.user.findUnique({
        where: { username: session.user?.name || "" }
      });

      if (dbUser) {
        //@ts-expect-error: it is important here
        session.user.id = dbUser.id;
      }

      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};