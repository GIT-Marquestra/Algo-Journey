'use client'
import UpdateContestCard, { Question } from '@/components/UpdateContest'
import axios from 'axios';
import React, { useState } from 'react'
import toast from 'react-hot-toast';

async function Page() {
  const [questions, setQuestions] = useState<Question[]>([])
  try {
    const response = await axios.post<{ questions: Question[] }>("/api/getQuestions");
    if (response.status === 200) {
      setQuestions(response.data.questions);
    } else {
      toast.error("Failed to fetch questions");
    }
  } catch (error) {
    console.error("Error fetching questions:", error);
    toast.error("Failed to fetch questions");
  return (
    <div>
      <UpdateContestCard dbQuestions={questions}/>
    </div>
  )
}
}
export default Page
