import { Language } from "../types";

export interface CodeExample {
  title: string;
  language: Language;
  code: string;
  description: string;
}

export const DUMMY_EXAMPLES: CodeExample[] = [
  {
    title: "React Infinite Render Loop & Stale State",
    language: "typescript",
    description: "A functional component demonstrating dependencies updating the same values they listen to, leading to call stack exhaustion, along with manual DOM side-effects.",
    code: `import React, { useState, useEffect } from 'react';

export default function buggyUserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  // BUG 1: Fetching inside render body or un-optimized useEffect causing crash
  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        // This state update triggers a re-render, leading to an infinite loop!
        setUpdateCount(updateCount + 1); 
      });
  }, [user]); // Listening to user which updates on every fetch

  // BUG 2: Direct DOM manipulation
  useEffect(() => {
    document.getElementById("user-title").innerText = user?.name || "Guest";
  }); // Missing dependency array entirely - runs on every single render

  return (
    <div className="profile-container">
      <h1 id="user-title">Loading...</h1>
      <p>Updates: {updateCount}</p>
    </div>
  );
}`
  },
  {
    title: "Python Insecure SQL Injection & Unclosed Resources",
    language: "python",
    description: "Demonstrates query concatenation (SQL Injection vulnerability) and non-safe system commands, combined with unhandled file resources.",
    code: `import sqlite3
import os

def check_user_profile(username, user_input_path):
    # BUG 1: SQL Injection vulnerability via raw string formatting
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    query = "SELECT * FROM accounts WHERE username = '%s'" % username
    cursor.execute(query)
    user_record = cursor.fetchone()
    
    # BUG 2: Resource leak - database connections are left open
    # conn.close() is missing or not in a try-finally block

    # BUG 3: Insecure system call / Command Injection
    # Allowing user-supplied paths to execute shell commands directly
    command = "ls -l " + user_input_path
    os.system(command)

    # BUG 4: File descriptive leak - opening files without 'with' or close()
    log_file = open("auth_log.txt", "a")
    log_file.write(f"Query executed for {username}\\n")
    # File is never closed, locking system handlers

    return user_record`
  },
  {
    title: "JavaScript Inefficient Array Processing",
    language: "javascript",
    description: "Extremely inefficient array operations that result in O(N^2) or higher complexity, creating severe performance hits on larger data scales.",
    code: `// Process a list of transactions to get unique client IDs with high scores
function processTransactions(transactions) {
  let results = [];
  
  // BUG 1: O(N^2) operation because of nested array checks inside loops
  for (let i = 0; i < transactions.length; i++) {
    let tx = transactions[i];
    
    if (tx.amount > 100) {
      // BUG 2: indexOf forces linear scanning on every iteration
      if (results.indexOf(tx.clientId) === -1) {
        results.push(tx.clientId);
      }
    }
  }

  // BUG 3: Redundant object copy and recreation inside map & filter
  const formatted = results.map(id => {
    // Inner loop to find full client info - extremely slow structure
    const matchingTx = transactions.find(t => t.clientId === id);
    return {
      clientId: id,
      name: matchingTx ? matchingTx.clientName : 'Unknown',
      timestamp: new Date().getTime() // Creating new Dates dynamically inside loops
    };
  });

  return formatted;
}`
  },
  {
    title: "C++ Memory Leak & Out of Bounds",
    language: "cpp",
    description: "Exhibits dangling pointers, memory leaks, and buffer overflow risks with raw arrays.",
    code: `#include <iostream>
#include <cstring>

void processRawBuffer(const char* input) {
    // BUG 1: Fixed-size buffer on the stack with unsafe copy (Buffer Overflow)
    char buffer[16];
    std::strcpy(buffer, input); 

    // BUG 2: Dynamic memory allocation without deallocation (Memory Leak)
    int* dynamicArray = new int[100];
    for (int i = 0; i <= 100; ++i) { // BUG 3: Off-by-one out-of-bounds write
        dynamicArray[i] = i * 2;
    }

    std::cout << "Buffer contents: " << buffer << std::endl;
    // dynamicArray is never deleted! delete[] dynamicArray; is missing.
}`
  }
];
