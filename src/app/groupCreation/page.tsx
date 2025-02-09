'use client'
import GroupManagement from '@/components/CreateGroup'
import AdminGroupCreator from '@/components/Group'
import GroupMemberAdder from '@/components/GroupMemberAdder'
import axios from 'axios'
import React, { useEffect, useState } from 'react'

interface Group {
  id: string,
  name: string
} 

function Page() {
  const [show, setShow] = useState('')
  const [group, setGroup] = useState<Group>()
  useEffect(() => {
    const func = async () => {
      const res1 = await axios.post('api/checkIfAdmin')
      if(res1.data.isAdmin){
        setShow('admin')
      }
      const res2 = await axios.post('api/isCoordinator')
      if(res2.data.isCoordinator){
        setShow('coord')
      }
      const response = await axios.post('api/getGroup')
      setGroup(response.data.group)
      console.log(response.data)
    }

    func()
  }, [])
  return (
    <div>
      <div>
        <GroupManagement/>
      </div>
      <div className='mt-5'>
        {show === 'coord' && group && <GroupMemberAdder groupId={group.id} groupName={group.name}/>} 
        {show === 'admin' && <AdminGroupCreator/>}        
      </div>
    </div>
  )
}

export default Page
