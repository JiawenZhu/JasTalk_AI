import { NextRequest, NextResponse } from 'next/server';

// Code execution interface
interface ExecutionRequest {
  code: string;
  language: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
  }>;
  timeLimit?: number; // in seconds
  memoryLimit?: number; // in MB
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  testResults?: {
    passed: number;
    total: number;
    results: Array<{
      input: string;
      expected: string;
      actual: string;
      passed: boolean;
    }>;
  };
  executionTime?: number;
  memoryUsed?: number;
}

// Language configurations
const LANGUAGE_CONFIGS = {
  javascript: {
    runtime: 'node',
    extension: 'js',
    template: (code: string) => `
// Sandboxed execution environment
const vm = require('vm');
const util = require('util');

const context = {
  console: {
    log: (...args) => {
      console.log(...args);
    }
  },
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  JSON,
  Math,
  Date,
  Array,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
  Error,
  TypeError,
  ReferenceError,
  SyntaxError
};

vm.createContext(context);

try {
  const result = vm.runInContext(\`${code.replace(/`/g, '\\`')}\`, context, {
    timeout: 5000,
    displayErrors: true
  });
} catch (error) {
  console.error('Execution error:', error.message);
  process.exit(1);
}
`
  },
  python: {
    runtime: 'python3',
    extension: 'py',
    template: (code: string) => `
import sys
import io
import contextlib
import resource
import signal
import time

# Security limitations
resource.setrlimit(resource.RLIMIT_CPU, (5, 5))  # 5 seconds CPU time
resource.setrlimit(resource.RLIMIT_AS, (128 * 1024 * 1024, 128 * 1024 * 1024))  # 128MB memory

def timeout_handler(signum, frame):
    raise TimeoutError("Code execution timed out")

signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(10)  # 10 seconds wall time

try:
    start_time = time.time()
    
    # Redirect stdout to capture output
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        # Execute user code in restricted environment
        restricted_globals = {
            '__builtins__': {
                'print': print,
                'len': len,
                'range': range,
                'enumerate': enumerate,
                'zip': zip,
                'map': map,
                'filter': filter,
                'sorted': sorted,
                'sum': sum,
                'min': min,
                'max': max,
                'abs': abs,
                'round': round,
                'int': int,
                'float': float,
                'str': str,
                'bool': bool,
                'list': list,
                'dict': dict,
                'set': set,
                'tuple': tuple,
            }
        }
        
        exec('''${code.replace(/'/g, "\\'")}''', restricted_globals)
    
    execution_time = (time.time() - start_time) * 1000
    output = f.getvalue()
    
    if output:
        print(output, end='')
    
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
finally:
    signal.alarm(0)
`
  },
  java: {
    runtime: 'java',
    extension: 'java',
    template: (code: string) => `
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public class Solution {
    public static void main(String[] args) {
        try {
            // Set up security manager to limit permissions
            System.setSecurityManager(new SecurityManager() {
                @Override
                public void checkPermission(java.security.Permission perm) {
                    // Allow basic operations but restrict file/network access
                    if (perm instanceof FilePermission || 
                        perm instanceof java.net.SocketPermission) {
                        throw new SecurityException("Operation not permitted");
                    }
                }
            });
            
            // Execute with timeout
            ExecutorService executor = Executors.newSingleThreadExecutor();
            Future<?> future = executor.submit(() -> {
                ${code}
            });
            
            future.get(5, TimeUnit.SECONDS);
            executor.shutdown();
            
        } catch (TimeoutException e) {
            System.err.println("Error: Code execution timed out");
            System.exit(1);
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }
}
`
  }
};

// Mock code execution for development (replace with actual sandboxed execution)
async function executeCodeMock(request: ExecutionRequest): Promise<ExecutionResult> {
  const { code, language, testCases } = request;
  
  // Simulate execution delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Basic validation
  if (!code.trim()) {
    return {
      success: false,
      error: 'Empty code provided'
    };
  }
  
  // Language-specific mock responses
  let output = '';
  let error = '';
  
  switch (language) {
    case 'javascript':
      if (code.includes('console.log')) {
        output = 'Hello World!\nThis is mock JavaScript execution';
      } else {
        output = 'JavaScript code executed successfully';
      }
      break;
      
    case 'python':
      if (code.includes('print')) {
        output = 'Hello World!\nThis is mock Python execution';
      } else {
        output = 'Python code executed successfully';
      }
      break;
      
    case 'java':
      if (code.includes('System.out.println')) {
        output = 'Hello World!\nThis is mock Java execution';
      } else {
        output = 'Java code executed successfully';
      }
      break;
      
    default:
      output = `${language} code executed successfully (mock)`;
  }
  
  // Mock syntax error detection
  if (code.includes('syntax_error') || code.includes('undefined_variable')) {
    return {
      success: false,
      error: `SyntaxError: Invalid ${language} syntax`
    };
  }
  
  // Mock test case execution
  let testResults;
  if (testCases && testCases.length > 0) {
    const results = testCases.map((testCase, index) => {
      // Mock test execution - some pass, some fail for demo
      const passed = Math.random() > 0.3; // 70% pass rate for demo
      const actual = passed ? testCase.expectedOutput : `incorrect_output_${index}`;
      
      return {
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual,
        passed
      };
    });
    
    const passed = results.filter(r => r.passed).length;
    testResults = {
      passed,
      total: testCases.length,
      results
    };
  }
  
  return {
    success: true,
    output,
    testResults,
    executionTime: Math.floor(Math.random() * 500) + 100, // 100-600ms
    memoryUsed: Math.floor(Math.random() * 20) + 5 // 5-25MB
  };
}

// Production code execution (implement with Docker/Lambda)
async function executeCodeProduction(request: ExecutionRequest): Promise<ExecutionResult> {
  // TODO: Implement actual sandboxed code execution
  // Options:
  // 1. Docker containers with resource limits
  // 2. AWS Lambda with custom runtimes
  // 3. Judge0 API or similar service
  // 4. WebAssembly sandboxes
  
  throw new Error('Production code execution not implemented yet');
}

export async function POST(req: NextRequest) {
  try {
    const body: ExecutionRequest = await req.json();
    const { code, language, testCases, timeLimit = 5, memoryLimit = 128 } = body;
    
    // Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code is required' },
        { status: 400 }
      );
    }
    
    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Language is required' },
        { status: 400 }
      );
    }
    
    // Check if language is supported
    const supportedLanguages = ['javascript', 'python', 'java', 'typescript', 'cpp', 'csharp', 'go', 'rust'];
    if (!supportedLanguages.includes(language)) {
      return NextResponse.json(
        { success: false, error: `Language ${language} is not supported` },
        { status: 400 }
      );
    }
    
    // Security checks
    const securityChecks = [
      { pattern: /require\s*\(\s*['"]fs['"]/, message: 'File system access not allowed' },
      { pattern: /require\s*\(\s*['"]child_process['"]/, message: 'Process execution not allowed' },
      { pattern: /require\s*\(\s*['"]net['"]/, message: 'Network access not allowed' },
      { pattern: /import\s+os/, message: 'OS module access not allowed' },
      { pattern: /import\s+subprocess/, message: 'Subprocess module not allowed' },
      { pattern: /import\s+socket/, message: 'Socket module not allowed' },
      { pattern: /Runtime\.getRuntime/, message: 'Runtime access not allowed' },
      { pattern: /ProcessBuilder/, message: 'Process execution not allowed' },
      { pattern: /System\.exit/, message: 'System exit not allowed in user code' }
    ];
    
    for (const check of securityChecks) {
      if (check.pattern.test(code)) {
        return NextResponse.json(
          { success: false, error: check.message },
          { status: 400 }
        );
      }
    }
    
    // Code length limit (prevent abuse)
    if (code.length > 50000) {
      return NextResponse.json(
        { success: false, error: 'Code length exceeds maximum limit (50KB)' },
        { status: 400 }
      );
    }
    
    // Execute code (use mock for now, replace with production implementation)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const result = isDevelopment 
      ? await executeCodeMock({ code, language, testCases, timeLimit, memoryLimit })
      : await executeCodeProduction({ code, language, testCases, timeLimit, memoryLimit });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Code execution API',
    supportedLanguages: ['javascript', 'python', 'java', 'typescript', 'cpp', 'csharp', 'go', 'rust'],
    status: 'available'
  });
} 
