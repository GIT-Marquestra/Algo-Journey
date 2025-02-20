
"use server"
import { LeetCode } from "leetcode-query";
import { CodeforcesAPI } from "codeforces-api-ts";
import axios from "axios";


export async function fetchLatestSubmissionsLeetCode(username: string){
    await new Promise((resolve) => (setTimeout((resolve), 1500)))
    try {
        const leetcode = new LeetCode()
        const userStats = await leetcode.user(username)
        return userStats
    } catch (error) {
        console.log("Error: ", error)
        return null
    }

} 




export async function fetchLatestSubmissionsCodeForces(username: string){
    
    if(process.env.CODEFORCES_API_KEY && process.env.CODEFORCES_SECRET){
        CodeforcesAPI.setCredentials({
            API_KEY: process.env.CODEFORCES_API_KEY,
            API_SECRET: process.env.CODEFORCES_SECRET,
          });
    }

    await new Promise((resolve) => (setTimeout((resolve), 500)))
    try {
       
        const userStats = await CodeforcesAPI.call("user.status", { handle: username });
        //@ts-expect-error : it important here
        return userStats.result
    } catch (error) {
        console.log("Error: ", error)
        return null
    }

} 

export async function fetchUserStats(username: string) {
    try {
      const response = await axios.get(`https://leetcode-stats-api.herokuapp.com/${username}`);
      return response.data
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }
  

export async function fetchCodeforcesUserData(username: string) {
    if (process.env.CODEFORCES_API_KEY && process.env.CODEFORCES_SECRET) {
        CodeforcesAPI.setCredentials({
            API_KEY: process.env.CODEFORCES_API_KEY,
            API_SECRET: process.env.CODEFORCES_SECRET,
        });
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
        const userInfo = await CodeforcesAPI.call("user.info", { handles: username });
        //@ts-expect-error : it important here
        if (userInfo && userInfo.result && userInfo.result.length > 0) {
            //@ts-expect-error : it important here
            const user = userInfo.result[0];

            return {
                handle: user.handle,
                rating: user.rating ?? "Unrated",
                maxRating: user.maxRating ?? "Unrated",
                rank: user.rank ?? "N/A",
            };
        }

        return null;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}


