import Editor from "@/components/Editor";


export default function Page() {
  return (
    <Editor
      question="<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>"
      defaultCode="def two_sum(nums, target):\n    # Your code here\n    pass"
      testCases={[
        { input: "two_sum([2,7,11,15], 9)", expected: "[0, 1]" },
        { input: "two_sum([3,2,4], 6)", expected: "[1, 2]" }
      ]}
    />
  );
}