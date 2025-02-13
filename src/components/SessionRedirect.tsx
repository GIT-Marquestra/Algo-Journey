"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SessionRedirect() {
  const { data: session, status } = useSession();
  const Router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.isComplete === false) {
      Router.replace("/auth/signup"); 
    } else if(status === "authenticated" && session?.user?.isComplete === false) {
      Router.push('/user/dashboard')
    }
  }, [session, status, Router]);

  return null;
}