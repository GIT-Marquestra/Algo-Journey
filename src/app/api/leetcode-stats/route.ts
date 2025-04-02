import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Helper function for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch single user's LeetCode stats
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
      throw new Error("User not found on LeetCode");
    }
    
    const result = {
      leetcodeUsername: userData.username,
      totalSolved: userData.submitStats.acSubmissionNum.find((item: any) => item.difficulty === "All")?.count || 0,
      easySolved: userData.submitStats.acSubmissionNum.find((item: any) => item.difficulty === "Easy")?.count || 0,
      mediumSolved: userData.submitStats.acSubmissionNum.find((item: any) => item.difficulty === "Medium")?.count || 0,
      hardSolved: userData.submitStats.acSubmissionNum.find((item: any) => item.difficulty === "Hard")?.count || 0
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
    
    // Process all users without rate limiting
    const userPromises = users.map(async (user) => {
      try {
        const stats = await fetchUserStats(user.leetcodeUsername);
        
        // Generate LeetCode profile URL
        const leetcodeProfileUrl = `https://leetcode.com/u/${user.leetcodeUsername}/`;
        
        if (stats) {
          // Create or update LeetCodeStats
          await prisma.leetCodeStats.upsert({
            where: { username: user.username },
            update: {
              totalSolved: stats.totalSolved,
              easySolved: stats.easySolved,
              mediumSolved: stats.mediumSolved,
              hardSolved: stats.hardSolved,
              userProfileUrl: leetcodeProfileUrl, // Update the userProfileUrl
              lastUpdated: new Date(),
            },
            create: {
              username: user.username,
              email: user.email,
              leetcodeUsername: user.leetcodeUsername,
              userProfileUrl: leetcodeProfileUrl, // Use the generated URL
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
    });
    
    // Wait for all users to finish processing
    await Promise.all(userPromises);

    return NextResponse.json({
      message: `Processed ${totalUsers} users: ${successCount.success} successful, ${successCount.failed} failed`,
      failedUsers,
    });
  } catch (error) {
    console.error("Error in LeetCode stats collection:", error);
    return NextResponse.json(
      { message: "Failed to collect LeetCode stats", error: String(error) },
      { status: 500 }
    );
  }
}