import { NextRequest, NextResponse } from 'next/server';
import { CodingQuestionsService } from '@/services/coding-questions.service';
import { CodingQuestion } from '@/types/interview';
import { createServerClient } from '@/lib/supabase';

const SAMPLE_CODING_QUESTIONS: Omit<CodingQuestion, 'id' | 'created_at'>[] = [
  {
    title: 'Two Sum',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table', 'Two Pointers'],
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
      '-10⁹ ≤ nums[i] ≤ 10⁹',
      '-10⁹ ≤ target ≤ 10⁹',
      'Only one valid answer exists.'
    ],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      }
    ],
    test_cases: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        expected_output: '[0,1]'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        expected_output: '[1,2]'
      },
      {
        input: 'nums = [3,3], target = 6',
        expected_output: '[0,1]',
        is_hidden: true
      }
    ],
    hints: [
      'A really brute force way would be to search for all possible pairs of numbers but that would be too slow.',
      'So, if we fix one of the numbers, say x, we have to scan the entire array to find the next number y which is value - x where value is the input parameter.',
      'The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?'
    ],
    time_limit: 30,
    memory_limit: 64,
    company_origin: 'LeetCode',
    topic: 'Arrays',
    is_active: true,
    solution_template: {
      javascript: `function twoSum(nums, target) {
    // Your solution here
    return [];
}`,
      python: `def two_sum(nums, target):
    # Your solution here
    return []`,
      java: `public int[] twoSum(int[] nums, int target) {
    // Your solution here
    return new int[]{};
}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
    // Your solution here
    return [];
}`,
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    // Your solution here
    return {};
}`,
      csharp: `public int[] TwoSum(int[] nums, int target) {
    // Your solution here
    return new int[]{};
}`,
      go: `func twoSum(nums []int, target int) []int {
    // Your solution here
    return []int{}
}`,
      rust: `impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        // Your solution here
        vec![]
    }
}`
    }
  },
  {
    title: 'Reverse String',
    description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    difficulty: 'Easy',
    tags: ['Two Pointers', 'String'],
    constraints: [
      '1 ≤ s.length ≤ 10⁵',
      's[i] is a printable ascii character.'
    ],
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: 'The string "hello" is reversed to "olleh".'
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]',
        explanation: 'The string "Hannah" is reversed to "hannaH".'
      }
    ],
    test_cases: [
      {
        input: 's = ["h","e","l","l","o"]',
        expected_output: '["o","l","l","e","h"]'
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        expected_output: '["h","a","n","n","a","H"]'
      }
    ],
    hints: [
      'The entire logic for reversing a string is based on using the opposite directional two-pointer approach!'
    ],
    time_limit: 15,
    memory_limit: 32,
    company_origin: 'LeetCode',
    topic: 'Strings',
    is_active: true,
    solution_template: {
      javascript: `function reverseString(s) {
    // Your solution here - modify s in-place
}`,
      python: `def reverse_string(s):
    # Your solution here - modify s in-place
    pass`,
      java: `public void reverseString(char[] s) {
    // Your solution here - modify s in-place
}`,
      typescript: `function reverseString(s: string[]): void {
    // Your solution here - modify s in-place
}`,
      cpp: `void reverseString(vector<char>& s) {
    // Your solution here - modify s in-place
}`,
      csharp: `public void ReverseString(char[] s) {
    // Your solution here - modify s in-place
}`,
      go: `func reverseString(s []byte) {
    // Your solution here - modify s in-place
}`,
      rust: `impl Solution {
    pub fn reverse_string(s: &mut Vec<char>) {
        // Your solution here - modify s in-place
    }
}`
    }
  },
  {
    title: 'Valid Parentheses',
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:

1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    difficulty: 'Easy',
    tags: ['String', 'Stack'],
    constraints: [
      '1 ≤ s.length ≤ 10⁴',
      's consists of parentheses only \'()[]{}\''
    ],
    examples: [
      {
        input: 's = "()"',
        output: 'true'
      },
      {
        input: 's = "()[]{}"',
        output: 'true'
      },
      {
        input: 's = "(]"',
        output: 'false'
      }
    ],
    test_cases: [
      {
        input: 's = "()"',
        expected_output: 'true'
      },
      {
        input: 's = "()[]{}"',
        expected_output: 'true'
      },
      {
        input: 's = "(]"',
        expected_output: 'false'
      },
      {
        input: 's = "([)]"',
        expected_output: 'false',
        is_hidden: true
      }
    ],
    hints: [
      'Use a stack of characters.',
      'When you encounter an opening bracket, push it to the top of the stack.',
      'When you encounter a closing bracket, check if the top of the stack was the opening for it. If yes, pop it from the stack. Otherwise, return false.'
    ],
    time_limit: 20,
    memory_limit: 32,
    company_origin: 'Google',
    topic: 'Stack',
    is_active: true,
    solution_template: {
      javascript: `function isValid(s) {
    // Your solution here
    return false;
}`,
      python: `def is_valid(s):
    # Your solution here
    return False`,
      java: `public boolean isValid(String s) {
    // Your solution here
    return false;
}`,
      typescript: `function isValid(s: string): boolean {
    // Your solution here
    return false;
}`,
      cpp: `bool isValid(string s) {
    // Your solution here
    return false;
}`,
      csharp: `public bool IsValid(string s) {
    // Your solution here
    return false;
}`,
      go: `func isValid(s string) bool {
    // Your solution here
    return false
}`,
      rust: `impl Solution {
    pub fn is_valid(s: String) -> bool {
        // Your solution here
        false
    }
}`
    }
  },
  {
    title: 'Maximum Subarray',
    description: `Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

A subarray is a contiguous part of an array.`,
    difficulty: 'Medium',
    tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
    constraints: [
      '1 ≤ nums.length ≤ 10⁵',
      '-10⁴ ≤ nums[i] ≤ 10⁴'
    ],
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: '[4,-1,2,1] has the largest sum = 6.'
      },
      {
        input: 'nums = [1]',
        output: '1'
      },
      {
        input: 'nums = [5,4,-1,7,8]',
        output: '23'
      }
    ],
    test_cases: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        expected_output: '6'
      },
      {
        input: 'nums = [1]',
        expected_output: '1'
      },
      {
        input: 'nums = [5,4,-1,7,8]',
        expected_output: '23'
      }
    ],
    hints: [
      'Try using dynamic programming approach.',
      'At each position, you can either extend the previous subarray or start a new subarray.',
      'Keep track of the maximum sum seen so far.'
    ],
    time_limit: 25,
    memory_limit: 64,
    company_origin: 'Meta',
    topic: 'Dynamic Programming',
    is_active: true,
    solution_template: {
      javascript: `function maxSubArray(nums) {
    // Your solution here
    return 0;
}`,
      python: `def max_sub_array(nums):
    # Your solution here
    return 0`,
      java: `public int maxSubArray(int[] nums) {
    // Your solution here
    return 0;
}`,
      typescript: `function maxSubArray(nums: number[]): number {
    // Your solution here
    return 0;
}`,
      cpp: `int maxSubArray(vector<int>& nums) {
    // Your solution here
    return 0;
}`,
      csharp: `public int MaxSubArray(int[] nums) {
    // Your solution here
    return 0;
}`,
      go: `func maxSubArray(nums []int) int {
    // Your solution here
    return 0
}`,
      rust: `impl Solution {
    pub fn max_sub_array(nums: Vec<i32>) -> i32 {
        // Your solution here
        0
    }
}`
    }
  },
  {
    title: 'Merge Two Sorted Lists',
    description: `You are given the heads of two sorted linked lists list1 and list2.

Merge the two lists in a one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.`,
    difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'],
    constraints: [
      'The number of nodes in both lists is in the range [0, 50].',
      '-100 ≤ Node.val ≤ 100',
      'Both list1 and list2 are sorted in non-decreasing order.'
    ],
    examples: [
      {
        input: 'list1 = [1,2,4], list2 = [1,3,4]',
        output: '[1,1,2,3,4,4]'
      },
      {
        input: 'list1 = [], list2 = []',
        output: '[]'
      },
      {
        input: 'list1 = [], list2 = [0]',
        output: '[0]'
      }
    ],
    test_cases: [
      {
        input: 'list1 = [1,2,4], list2 = [1,3,4]',
        expected_output: '[1,1,2,3,4,4]'
      },
      {
        input: 'list1 = [], list2 = []',
        expected_output: '[]'
      }
    ],
    hints: [
      'Think about the base cases: when one list is empty.',
      'Compare the values of the current nodes and choose the smaller one.',
      'Recursively merge the rest of the lists.'
    ],
    time_limit: 20,
    memory_limit: 32,
    company_origin: 'Amazon',
    topic: 'Linked Lists',
    is_active: true,
    solution_template: {
      javascript: `function mergeTwoLists(list1, list2) {
    // Definition for singly-linked list.
    // function ListNode(val, next) {
    //     this.val = (val===undefined ? 0 : val)
    //     this.next = (next===undefined ? null : next)
    // }
    
    // Your solution here
    return null;
}`,
      python: `def merge_two_lists(list1, list2):
    # Definition for singly-linked list.
    # class ListNode:
    //     def __init__(self, val=0, next=None):
    //         self.val = val
    //         self.next = next
    
    // Your solution here
    return None`,
      java: `public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
    // Definition for singly-linked list.
    // public class ListNode {
    //     int val;
    //     ListNode next;
    //     ListNode() {}
    //     ListNode(int val) { this.val = val; }
    //     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
    // }
    
    // Your solution here
    return null;
}`,
      typescript: `function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
    // Definition for singly-linked list.
    // class ListNode {
    //     val: number
    //     next: ListNode | null
    //     constructor(val?: number, next?: ListNode | null) {
    //         this.val = (val===undefined ? 0 : val)
    //         this.next = (next===undefined ? null : next)
    //     }
    // }
    
    // Your solution here
    return null;
}`,
      cpp: `ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
    // Definition for singly-linked list.
    // struct ListNode {
    //     int val;
    //     ListNode *next;
    //     ListNode() : val(0), next(nullptr) {}
    //     ListNode(int x) : val(x), next(nullptr) {}
    //     ListNode(int x, ListNode *next) : val(x), next(next) {}
    // };
    
    // Your solution here
    return nullptr;
}`,
      csharp: `public ListNode MergeTwoLists(ListNode list1, ListNode list2) {
    // Definition for singly-linked list.
    // public class ListNode {
    //     public int val;
    //     public ListNode next;
    //     public ListNode(int val=0, ListNode next=null) {
    //         this.val = val;
    //         this.next = next;
    //     }
    // }
    
    // Your solution here
    return null;
}`,
      go: `func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
    // Definition for singly-linked list.
    // type ListNode struct {
    //     Val int
    //     Next *ListNode
    // }
    
    // Your solution here
    return nil
}`,
      rust: `impl Solution {
    pub fn merge_two_lists(list1: Option<Box<ListNode>>, list2: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
        // Definition for singly-linked list.
        // #[derive(PartialEq, Eq, Clone, Debug)]
        // pub struct ListNode {
        //   pub val: i32,
        //   pub next: Option<Box<ListNode>>
        // }
        
        // Your solution here
        None
    }
}`
    }
  }
];

// Simple test to check database connectivity
async function testDatabaseConnection() {
  try {
    const supabase = createServerClient();
    
    // Test basic connection
    const { data, error } = await supabase
      .from('coding_question')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Starting to seed coding questions...');
    
    // Test database connectivity first
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed'
      }, { status: 500 });
    }
    
    // First, let's check if we can connect to the database
    const existingQuestions = await CodingQuestionsService.getAllCodingQuestions();
    console.log(`Found ${existingQuestions.length} existing coding questions`);
    
    const createdQuestions = [];
    
    for (const questionData of SAMPLE_CODING_QUESTIONS) {
      try {
        // Check if question already exists
        const existingQuestion = existingQuestions.find(q => q.title === questionData.title);
        if (existingQuestion) {
          console.log(`Question "${questionData.title}" already exists, skipping...`);
          createdQuestions.push(existingQuestion);
          continue;
        }
        
        console.log(`Creating question: ${questionData.title}`);
        const createdQuestion = await CodingQuestionsService.createCodingQuestion(questionData);
        createdQuestions.push(createdQuestion);
        console.log(`Successfully created question: ${createdQuestion.title}`);
      } catch (error) {
        console.error(`Failed to create question: ${questionData.title}`, error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${createdQuestions.length} coding questions`,
      questions: createdQuestions.map(q => ({ id: q.id, title: q.title, difficulty: q.difficulty }))
    });
    
  } catch (error) {
    console.error('Error seeding coding questions:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to seed coding questions' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Coding Questions Seeder API',
    description: 'POST to this endpoint to seed sample coding questions',
    status: 'available'
  });
} 
