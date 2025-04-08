import { NextResponse } from 'next/server';
import axios from 'axios';
import prisma from '@/lib/prisma';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchUserStats(username: string) {
  try {
    const query = {
      query: `{
        matchedUser(username: "${username}") {
          username
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
        }
      }`
    };

    const response = await axios.post("https://leetcode.com/graphql", query, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    const userData = response.data?.data?.matchedUser;
    if (!userData) {
      console.log("User not found on LeetCode");
    }
    
    const result = {
      leetcodeUsername: userData.username,
      //@ts-expect-error: no need here...
      totalSolved: userData.submitStats.acSubmissionNum.find((item) => item.difficulty === "All")?.count || 0,
      //@ts-expect-error: no need here...
      easySolved: userData.submitStats.acSubmissionNum.find((item) => item.difficulty === "Easy")?.count || 0,
      //@ts-expect-error: no need here...
      mediumSolved: userData.submitStats.acSubmissionNum.find((item) => item.difficulty === "Medium")?.count || 0,
      //@ts-expect-error: no need here...
      hardSolved: userData.submitStats.acSubmissionNum.find((item) => item.difficulty === "Hard")?.count || 0
    };

    return result;
  } catch (error) {
    console.error("Error fetching user stats for", username, ":", error);
    return null;
  }
}

export async function GET() {
  try {
    const stats = await prisma.leetCodeStats.findMany({
      orderBy: {
        totalSolved: 'desc',
      }
    });
    
    return NextResponse.json({
      data: stats,
      count: stats.length,
    });
  } catch (error) {
    console.error("Error retrieving stats:", error);
    return NextResponse.json(
      { message: "Failed to retrieve LeetCode stats", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    processUsersInBackground();
    return NextResponse.json({
      message: "LeetCode stats collection process has started running in backend",
      status: "processing"
    });
  } catch (error) {
    console.error("Error initiating LeetCode stats collection:", error);
    return NextResponse.json(
      { message: "Failed to initiate LeetCode stats collection", error: String(error) },
      { status: 500 }
    );
  }
}

// This function will run in the background
async function processUsersInBackground() {
  try {
    // Get all users with leetcodeUsername
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        leetcodeUsername: true,
        profileUrl: true,
      },
      where: {
        leetcodeUsername: {
          not: "",
        },
      },
    });

    const totalUsers = users.length;
    const successCount = { success: 0, failed: 0 };
    const failedUsers: string[] = [];
    
    const BATCH_SIZE = 5;
    const DELAY_BETWEEN_USERS = 1000; 
    const DELAY_BETWEEN_BATCHES = 5000; 

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map((user, index) => 
        new Promise<void>(async (resolve) => {
          await delay(index * DELAY_BETWEEN_USERS);
          
          try {
            const stats = await fetchUserStats(user.leetcodeUsername);
            
            if (stats) {
              await prisma.leetCodeStats.upsert({
                where: { username: user.username },
                update: {
                  totalSolved: stats.totalSolved,
                  easySolved: stats.easySolved,
                  mediumSolved: stats.mediumSolved,
                  hardSolved: stats.hardSolved,
                  lastUpdated: new Date(),
                },
                create: {
                  username: user.username,
                  email: user.email,
                  leetcodeUsername: user.leetcodeUsername,
                  userProfileUrl: user.profileUrl || "",
                  totalSolved: stats.totalSolved,
                  easySolved: stats.easySolved,
                  mediumSolved: stats.mediumSolved,
                  hardSolved: stats.hardSolved,
                },
              });
              
              successCount.success++;
            } else {
              failedUsers.push(user.leetcodeUsername);
              successCount.failed++;
            }
          } catch (error) {
            failedUsers.push(user.leetcodeUsername);
            successCount.failed++;
            console.error(`Error processing user ${user.leetcodeUsername}:`, error);
          }
          
          resolve();
        })
      );

      await Promise.all(batchPromises);

      if (i + BATCH_SIZE < users.length) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    // Log completion statistics when finished
    console.log(`Background process completed: Processed ${totalUsers} users: ${successCount.success} successful, ${successCount.failed} failed`);
    console.log("Failed users:", failedUsers);
    
    // Optionally, store the result in the database or use webhooks to notify completion
    
  } catch (error) {
    console.error("Error in background LeetCode stats collection:", error);
  }
}