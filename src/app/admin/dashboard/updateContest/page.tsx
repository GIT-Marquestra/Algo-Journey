import UpdateContestCard from '@/components/UpdateContest'
import prisma from '@/lib/prisma'
import React from 'react'

async function Page() {
    const dbQuestions = await prisma.question.findMany({
        include:{
            questionTags: true
        },
        orderBy:{
            createdAt: 'desc'
        }
    })
  return (
    <div>
      <UpdateContestCard dbQuestions={dbQuestions}/>
    </div>
  )
}

export default Page
