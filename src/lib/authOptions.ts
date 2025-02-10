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
      profile(profile) {
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
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("SignIn Callback Started", {
        userEmail: user.email,
        provider: account?.provider
      });

      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findFirst({
            where: {
              email: {
                equals: user.email!,
                mode: 'insensitive'  // Make the search case insensitive
              }
            }
          });

          console.log("Database search result:", existingUser);

          if (!existingUser) {
            console.log("No user found in database");
            return false;
          }

          console.log("User found, allowing sign in");
          return true;
        } catch (error) {
          console.error("Error during sign in check:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session }) {
      if (session.user) {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: session.user.email || "" },
              { username: session.user.name || "" }
            ]
          }
        });

        console.log("Session Callback - DB User:", dbUser);

        if (dbUser) {
          // Use your database values instead of Google's
          session.user.name = dbUser.username;
          session.user.email = dbUser.email;
        }
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET
};