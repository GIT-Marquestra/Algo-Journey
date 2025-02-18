'use client';
import AllQuestions from '@/components/AllQuestions'
import axios from 'axios';
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation';
import React, { useEffect, useState } from 'react'

function Page() {
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    const func = async () => {
      const res1 = await axios.post('../api/checkIfAdmin')
      if(res1.data.isAdmin)
        setIsAdmin(true)
    }
    func()
    if(!isAdmin)
      redirect("/user/dashboard")
  }, [])
  return (
    <div className='flex items-center justify-center pt-16 w-full h-screen'>
      <div className='w-full h-full overflow-auto'>
        <AllQuestions/>
      </div>
    </div>
  )
}

export default Page