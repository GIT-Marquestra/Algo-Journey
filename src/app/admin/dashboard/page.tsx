import AllQuestions from '@/components/AllQuestions'
import React from 'react'

function Page() {
  return (
    <div className='flex items-center justify-center pt-16 w-full h-screen'>
      <div className='w-full h-full overflow-auto'>
        <AllQuestions/>
      </div>
    </div>
  )
}

export default Page