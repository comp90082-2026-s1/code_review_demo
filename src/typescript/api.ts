/**
 * TypeScript API module with intentional issues.
 */

// --- Type Safety Issues ---

// Using 'any' defeats the purpose of TypeScript
function processData(data: any): any {
  return data.map((item: any) => item.value);
}

// Non-null assertion abuse
function getUser(users: Map<string, User>, id: string): string {
  return users.get(id)!.name; // Will crash if id not found
}

// --- Security Issues ---

interface User {
  name: string;
  email: string;
  password: string; // Storing plaintext password
  role: string;
}

// Unsafe innerHTML equivalent
function renderHtml(userInput: string): string {
  return `<div>${userInput}</div>`; // Template literal XSS
}

// Unsafe type assertion
function parseInput(input: unknown): User {
  return input as User; // No validation, just trust the input
}

// --- Code Quality ---

// God function: does too many things
async function handleRequest(
  method: string,
  path: string,
  body: any,
  headers: Record<string, string>,
  query: Record<string, string>,
  cookies: Record<string, string>,
  session: any,
): Promise<any> {
  if (method === "GET") {
    if (path === "/users") {
      // fetch users
      const users = await fetch("/api/users");
      return users.json();
    } else if (path === "/posts") {
      const posts = await fetch("/api/posts");
      return posts.json();
    } else if (path === "/comments") {
      const comments = await fetch("/api/comments");
      return comments.json();
    }
  } else if (method === "POST") {
    if (path === "/users") {
      const result = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return result.json();
    }
  } else if (method === "DELETE") {
    // No authorization check before delete!
    const result = await fetch(`/api${path}`, { method: "DELETE" });
    return result.json();
  }
  return { error: "not found" };
}

// Magic numbers
function calculateDiscount(price: number, quantity: number): number {
  if (quantity > 100) {
    return price * 0.85;
  } else if (quantity > 50) {
    return price * 0.9;
  } else if (quantity > 25) {
    return price * 0.93;
  } else if (quantity > 10) {
    return price * 0.95;
  }
  return price;
}

// Promise without error handling
function sendNotification(userId: string, message: string) {
  fetch("/api/notify", {
    method: "POST",
    body: JSON.stringify({ userId, message }),
  });
  // Fire and forget — no .catch(), no await
}

export { processData, getUser, renderHtml, handleRequest, calculateDiscount };
