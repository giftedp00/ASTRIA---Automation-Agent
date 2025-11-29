import { FunctionDeclaration, Type } from "@google/genai";

// 1. Tool Declarations for Gemini
export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "send_email",
    description: "Send an email to a specific recipient with a subject and body.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        recipient: { type: Type.STRING, description: "Email address of the recipient" },
        subject: { type: Type.STRING, description: "Subject line of the email" },
        body: { type: Type.STRING, description: "Content of the email" },
      },
      required: ["recipient", "subject", "body"],
    },
  },
  {
    name: "schedule_meeting",
    description: "Schedule a calendar meeting or event.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Title of the meeting" },
        participants: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "List of email addresses or names of participants"
        },
        startTime: { type: Type.STRING, description: "ISO 8601 date-time string for when the meeting starts (e.g., 2023-10-27T10:00:00)" },
        durationMinutes: { type: Type.NUMBER, description: "Duration of the meeting in minutes" },
      },
      required: ["title", "startTime"],
    },
  },
  {
    name: "save_note",
    description: "Save a text note to the user's personal storage or memory.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Title of the note" },
        content: { type: Type.STRING, description: "Body text of the note" },
        tags: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Optional tags for categorization"
        },
      },
      required: ["content"],
    },
  },
  {
    name: "get_weather",
    description: "Get the current weather for a specific location.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: { type: Type.STRING, description: "City, state, or zip code" },
      },
      required: ["location"],
    },
  }
];

// 2. Local Simulation Logic
export const executeToolLocally = async (name: string, args: any): Promise<any> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  switch (name) {
    case "send_email":
      return {
        status: "success",
        id: `email_${Date.now()}`,
        message: `Email sent to ${args.recipient}`,
        timestamp: new Date().toISOString()
      };
    
    case "schedule_meeting":
      return {
        status: "success",
        id: `cal_${Date.now()}`,
        message: `Meeting '${args.title}' scheduled.`,
        details: {
          time: args.startTime,
          attendees: args.participants?.length || 0
        }
      };

    case "save_note":
      return {
        status: "success",
        id: `note_${Date.now()}`,
        savedAt: new Date().toISOString(),
        preview: args.content.substring(0, 50) + "..."
      };

    case "get_weather":
      // Generate somewhat realistic fake weather data
      const conditions = ["Sunny", "Cloudy", "Rainy", "Partly Cloudy"];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      const temp = Math.floor(Math.random() * (30 - 10) + 10);
      return {
        location: args.location,
        temperature: `${temp}°C`,
        condition: condition,
        humidity: "45%",
        wind: "12 km/h NW"
      };

    default:
      return { error: `Tool ${name} not found locally.` };
  }
};