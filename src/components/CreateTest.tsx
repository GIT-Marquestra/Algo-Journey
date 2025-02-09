
"use client"
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const CreateTestForm = () => {
    const [lastContestNum, setLastContestNum] = useState(0)
  const [questions, setQuestions] = useState<
    { leetcodeUrl: string; codeforcesUrl: string; difficulty: string; points: number; slug: string }[]
  >([]);
  // tags

  const [formData, setFormData] = useState({
    leetcodeUrl: "",
    codeforcesUrl: "",
    difficulty: "Easy",
    points: 40,
    slug: "",
  });

  const difficultyPoints: Record<string, number> = {
    Easy: 40,
    Medium: 80,
    Hard: 120,
  };

  useEffect(() => {

    const checkAdmin = async () => {
      try {
        const response = await axios.post('/api/checkIfAdmin')

        if(!response.data.isAdmin) return 


      } catch (error) {
        console.log(error)
        
      }
    }

    checkAdmin()

  }, [])

  const extractLeetCodeSlug = (url: string) => {
    const match = url.match(/leetcode\.com\/problems\/([^\/]+)/);
    return match ? match[1] : "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      points: name === "difficulty" ? difficultyPoints[value] : prev.points,
      slug: name === "leetcodeUrl" ? extractLeetCodeSlug(value) : prev.slug,
    }));
  };

  const handleAddQuestion = async () => {
      console.log('hi there')
    //   if()
      try {
        console.log(1)
        const res = await axios.post("/api/auth/signup", {
            headers: {
              "Content-Type": "application/json",
            },
          });
        if(!res){
            setLastContestNum(1)
        }
        if(res){
            setLastContestNum(res.data + 1)
        }
        console.log(lastContestNum)
        console.log('Response: ', res)
    } catch (error) {
        console.log("Error in handleAddQuestion: ", error)
    }
    

    if (!formData.leetcodeUrl && !formData.codeforcesUrl) return toast.error("At least one URL is required!");
    if (!formData.slug) return toast.error("Slug could not be extracted!");

    setQuestions((prev) => [...prev, formData]);

    setFormData({
      leetcodeUrl: "",
      codeforcesUrl: "",
      difficulty: "Easy",
      points: 40,
      slug: "",
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) return toast.error("Add at least one question!");
    console.log("Test Created with Questions:", questions);
    toast.success("Test created successfully!");
  };

  return (
    <div className="max-w-lg mx-auto bg-gray-900 text-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Create a New Test</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block mb-1">LeetCode Question URL</label>
          <input
            type="url"
            name="leetcodeUrl"
            value={formData.leetcodeUrl}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1">Codeforces Question URL</label>
          <input
            type="url"
            name="codeforcesUrl"
            value={formData.codeforcesUrl}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1">Question Slug</label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            readOnly
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1">Difficulty Level</label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Hard">Very Hard</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Points</label>
          <input
            type="number"
            name="points"
            value={formData.points}
            readOnly
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md"
          />
        </div>

        <button
          type="button"
          onClick={()=>handleAddQuestion()}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded-md"
        >
          Add Question
        </button>

        {questions.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Added Questions</h3>
            <ul className="space-y-2">
              {questions.map((q, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-gray-800 rounded-md">
                  <span>{q.slug} - {q.difficulty} ({q.points} pts)</span>
                  <button
                    onClick={() => handleRemoveQuestion(index)}
                    className="text-red-400 hover:text-red-600"
                  >
                    ✖
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
        >
          Create Test
        </button>
      </form>
    </div>
  );
};

export default CreateTestForm;