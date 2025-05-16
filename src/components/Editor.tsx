'use client'

import React, { useState, useEffect, useRef } from 'react'
import Script from 'next/script'

interface TestCase {
  input: string
  expected: string
}

interface EditorProps {
  question: string
  defaultCode?: string
  testCases?: TestCase[]
}

interface TestResult {
  input: string
  expected: string
  actual: string
  passed: boolean
}

// Define a global interface to access Pyodide
declare global {
  interface Window {
    loadPyodide: (config: any) => Promise<any>
  }
}

const DEFAULT_PYTHON_CODE = `# Write your Python solution here

def two_sum(nums, target):
    # Example implementation
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
`

export default function Editor({ question, defaultCode = DEFAULT_PYTHON_CODE, testCases = [] }: EditorProps) {
  const [code, setCode] = useState(defaultCode)
  const [isPyodideReady, setIsPyodideReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const pyodideRef = useRef<any>(null)

  // Initialize Pyodide after the script is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && scriptLoaded && !isPyodideReady) {
      const initPyodide = async () => {
        try {
          setIsLoading(true)
          const pyodide = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
          })
          pyodideRef.current = pyodide
          setIsPyodideReady(true)
          setIsLoading(false)
        } catch (err) {
          console.error('Failed to initialize Pyodide:', err)
          setError('Failed to load Python environment. Please try again later.')
          setIsLoading(false)
        }
      }

      initPyodide()
    }
  }, [scriptLoaded, isPyodideReady])

  const runCode = async () => {
    if (!isPyodideReady || !pyodideRef.current) {
      setError('Python environment is not ready yet. Please wait.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const pyodide = pyodideRef.current

      // Execute the user's code to define the functions
      await pyodide.runPythonAsync(code)

      // Process each test case
      const newResults: TestResult[] = await Promise.all(
        testCases.map(async (testCase) => {
          try {
            // Extract the function name and arguments from the input string
            const input = testCase.input
            const functionCall = input.includes('(') ? input : `${input}()`

            // Run the test case
            const result = await pyodide.runPythonAsync(`
try:
    result = str(${functionCall})
    print(result)
    result
except Exception as e:
    str(e)
`)
            
            const actual = result.toString()
            
            // Compare with expected output, handling different string formats
            let expected = testCase.expected
            let passed = false
            
            // Clean up the strings for comparison
            const cleanActual = actual.replace(/[\s'"]/g, '')
            const cleanExpected = expected.replace(/[\s'"]/g, '')
            
            passed = cleanActual === cleanExpected

            return {
              input: testCase.input,
              expected: testCase.expected,
              actual,
              passed,
            }
          } catch (err) {
            return {
              input: testCase.input,
              expected: testCase.expected,
              actual: `Error: ${err}`,
              passed: false,
            }
          }
        })
      )

      setResults(newResults)
    } catch (err) {
      console.error('Error running code:', err)
      setError(`Error executing code: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mt-20 mx-auto p-4 bg-white rounded-lg shadow-md">
      {/* Load Pyodide script */}
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
        onError={() => setError('Failed to load Pyodide script')}
      />

      {/* Question Section */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Problem:</h2>
        <div className="bg-gray-50 p-4 rounded-md">
          <div dangerouslySetInnerHTML={{ __html: question }} />
        </div>
      </div>

      {/* Code Editor */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Solution:</h2>
        <textarea
          className="w-full h-64 p-4 font-mono text-sm bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck="false"
        />
      </div>

      {/* Controls */}
      <div className="mb-4 flex items-center">
        <button
          className={`px-4 py-2 rounded-md font-medium ${
            isPyodideReady && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={runCode}
          disabled={!isPyodideReady || isLoading}
        >
          {isLoading ? 'Running...' : 'Run Code'}
        </button>
        
        {!isPyodideReady && !error && (
          <span className="ml-4 text-amber-600">
            Loading Python environment...
          </span>
        )}
        
        {error && <span className="ml-4 text-red-600">{error}</span>}
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2">Test Results:</h2>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-md ${
                  result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{result.input}</span>
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-semibold">Expected:</span>{' '}
                    <span className="font-mono">{result.expected}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Actual:</span>{' '}
                    <span className="font-mono">{result.actual}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}