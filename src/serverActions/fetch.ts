
"use server"
import { LeetCode } from "leetcode-query";
import { CodeforcesAPI } from "codeforces-api-ts";
export async function fetchLatestSubmissionsLeetCode(username: string){
    await new Promise((resolve) => (setTimeout((resolve), 1500)))
    try {
        const leetcode = new LeetCode()
        const userStats = await leetcode.user(username)
        // console.log("User Stats: ", userStats)
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
        // console.log(userStats)
        //@ts-expect-error : it important here
        return userStats.result
    } catch (error) {
        console.log("Error: ", error)
        return null
    }

} 


