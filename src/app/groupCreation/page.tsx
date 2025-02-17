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
  const [show, setShow] = useState(false)
  const [showAdminSpecific, setShowAdminSpecific] = useState(false)
  const [group, setGroup] = useState<Group>()
  useEffect(() => {
    const func = async () => {
      const res1 = await axios.post('api/checkIfAdmin')
      if(res1.data.isAdmin){
        setShowAdminSpecific(true)
      }
      const res2 = await axios.post('api/isCoordinator')
      if(res2.data.isCoordinator){
        setShow(true)
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
        <GroupManagement isAdmin={showAdminSpecific}/>
      </div>
      <div className='mt-5'>
        {show && group && <GroupMemberAdder groupId={group.id} groupName={group.name}/>} 
        {showAdminSpecific && <AdminGroupCreator/>}        
      </div>
    </div>
  )
}
export default Page