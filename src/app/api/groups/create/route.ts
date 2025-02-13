import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const request = await req.json();
    
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userEmail = session.user.email;
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const admins = ["Abhishek Verma", "Taj", "Kunal", "Sai"];
    if(!user.username) return 
    if (!admins.includes(user.username)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, users, coordinator, newGroupName } = request;

  
    if (coordinator) {
      const coordinatorUser = await prisma.user.findUnique({
        where: { id: coordinator },
      });

      if (!coordinatorUser) {
        return NextResponse.json({ error: "Coordinator not found" }, { status: 404 });
      }
    }

    const existingGroup = await prisma.group.findUnique({
      where: { name },
      include: { members: true },
    });

    if (existingGroup) {
  
      const currentMemberIds = existingGroup.members.map(member => member.id);

      let allUserIds = [...currentMemberIds];
      
      
      
      const updatedGroup = await prisma.$transaction(async (tx) => {
        
        const updateData: any = {
          members: {
            set: allUserIds.map(id => ({ id }))
          }
        };
        

        
        if (newGroupName) {
          updateData.name = newGroupName;
        }


        if (coordinator) {
          updateData.coordinator = { connect: { id: coordinator } };
        }


        const updatedGroup = await tx.group.update({
          where: { id: existingGroup.id },
          data: updateData,
          include: { 
            members: true,
            coordinator: true  
          },
        });

        if(users){
          const newUserIds = users.filter((id: string) => !currentMemberIds.includes(id));
          allUserIds = [...newUserIds];
          
          if (newUserIds.length > 0) {
            await tx.user.updateMany({
              where: { id: { in: newUserIds } },
              data: { groupId: existingGroup.id },
            });
          }
        } 



        return updatedGroup;
      },
      { timeout: 30000 });


      let updateMessage = "Group updated successfully:";
      if (coordinator) updateMessage += " Coordinator updated.";
      if (newGroupName) updateMessage += " Name updated.";

      return NextResponse.json({ 
        group: updatedGroup, 
        message: updateMessage,
        updates: {
          nameUpdated: !!newGroupName,
          coordinatorUpdated: !!coordinator
        }
      }, { status: 200 });
    } else {
   
      if (!coordinator) {
        return NextResponse.json({ error: "Coordinator is required for new group creation" }, { status: 400 });
      }

      const group = await prisma.$transaction(
        async (tx) => {
          const newGroup = await tx.group.create({
            data: {
              name,
              coordinator: { connect: { id: coordinator } },
              members: { connect: users.map((id: string) => ({ id })) },
            },
            include: {
              members: true,
              coordinator: true
            }
          });

          await tx.user.updateMany({
            where: { id: { in: users } },
            data: { groupId: newGroup.id },
          });

          return newGroup;
        },
        { timeout: 30000 }
      );

      return NextResponse.json({ 
        group, 
        message: "Group created successfully",
        updates: {
          membersAdded: users.length,
          nameUpdated: true,
          coordinatorUpdated: true
        }
      }, { status: 200 });
    }
  } catch (error) {
    console.error("Error creating/updating group:", error);
    return NextResponse.json({ error: "Failed to create/update group" }, { status: 500 });
  }
}