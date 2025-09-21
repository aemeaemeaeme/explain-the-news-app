import { api } from "encore.dev/api";

interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

interface ContactResponse {
  success: boolean;
  error?: string;
}

export const contact = api<ContactRequest, ContactResponse>(
  { expose: true, method: "POST", path: "/contact" },
  async ({ name, email, message }) => {
    // Basic validation
    if (!name || !email || !message) {
      return { success: false, error: "Missing required fields" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email address" };
    }

    // In a real app, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Integrate with CRM system
    
    // For now, just log the message
    console.log("Contact form submission:", {
      name,
      email,
      message: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
      timestamp: new Date().toISOString()
    });

    return { success: true };
  }
);