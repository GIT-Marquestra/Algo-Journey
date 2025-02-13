'use client'
import SignIn from '@/components/SignIn'
import { useSession } from 'next-auth/react'
import React from 'react'

function SignInPage() {
  const { data: session } = useSession()

  return (
    <div>
      {!session?.user?.email && <SignIn/>}
      
    </div>
  )
}

export default SignInPage
