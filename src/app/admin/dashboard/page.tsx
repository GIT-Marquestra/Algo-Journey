'use client';
import AllQuestions from '@/components/AllQuestions'
import axios from 'axios';
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation';
import React, { useEffect, useState } from 'react'

function Page() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await axios.post('../api/checkIfAdmin')
        if (res.data.isAdmin) {
          setIsAdmin(true)
        } else {
          redirect("/user/dashboard")
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        redirect("/user/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    checkAdmin()
  }, []) // Empty dependency array since we only want to check once

  if (isLoading) {
    return <div>Loading...</div> // Or your loading component
  }

  return (
    <div className='flex items-center justify-center pt-16 w-full h-screen'>
      <div className='w-full h-full overflow-auto'>
        <AllQuestions/>
      </div>
    </div>
  )
}

export default Page