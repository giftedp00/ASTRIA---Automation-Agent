import { GoogleGenAI } from "@google/genai";
import { executeToolLocally, toolDeclarations } from "./tools";
import { ToolCallData } from "../types";

// ASTRIA System Prompt
const SYSTEM_INSTRUCTION = `
You are ASTRIA, an advanced Automation & Tool-Calling AI Agent.

Your primary objective is to understand user requests, convert them into structured actions, and execute them using available tools. Always use the most appropriate tool when the task requires external data, calculations, actions, or formatting.

=====================
CORE BEHAVIOR RULES
=====================

1. **Think → Decide → Act**
   - First, analyze the user's request and determine the intention.
   - If a tool is needed, call it immediately with structured JSON arguments.
   - If no tool is appropriate, respond clearly and directly.

2. **Follow the Tool Calling Protocol**
   - Use tools ONLY when required.
   - Arguments must be clean JSON.
   - If required input is missing, ask the user for the missing info.

3. **Actionable Task Execution**
   - Sending emails (send_email)
   - Scheduling tasks (schedule_meeting)
   - Saving records (save_note)
   - Getting weather (get_weather)
   - Web Search (googleSearch tool)

4. **Output Rules**
   - If you use a tool → Output the tool call.
   - If no tool is used → respond in helpful, professional, plain language.
   - Be concise, structured, and reliable.
   - Do not role-play. Stay task-oriented.
`;

let ai: GoogleGenAI | null = null;
let chatSession: any = null;

export const initializeGemini = () => {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
};

export const startNewChat = () => {
  if (!ai) initializeGemini();
  if (!ai) throw new Error("API Key not found");

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [
        { functionDeclarations: toolDeclarations },
        { googleSearch: {} } // Enable Google Search
      ]
    }
  });
};

export const sendMessageToAstria = async (
  message: string,
  onToolCallStart?: (toolCalls: ToolCallData[]) => void,
  onToolCallComplete?: (toolCalls: ToolCallData[]) => void
): Promise<{ text: string; toolCalls?: ToolCallData[]; groundingChunks?: any[] }> => {
  
  if (!chatSession) startNewChat();

  try {
    // 1. Send user message
    let response = await chatSession.sendMessage({ message });
    
    const initialCandidates = response.candidates?.[0];
    const initialContent = initialCandidates?.content;
    const initialParts = initialContent?.parts || [];

    // Check for Google Search grounding
    const groundingChunks = initialCandidates?.groundingMetadata?.groundingChunks;

    // Check for Function Calls
    const functionCalls = initialParts
      .filter((part: any) => part.functionCall)
      .map((part: any) => part.functionCall!);

    // If text only
    if (functionCalls.length === 0) {
      return { 
        text: response.text || "", 
        groundingChunks 
      };
    }

    // 2. Handle Function Calls
    // Convert to our internal ToolCallData format
    const currentToolCalls: ToolCallData[] = functionCalls.map((fc: any, index: number) => ({
      id: fc.id || `call_${index}_${Date.now()}`,
      name: fc.name,
      args: fc.args,
      status: 'pending'
    }));

    // Notify UI that tools are starting
    if (onToolCallStart) onToolCallStart(currentToolCalls);

    // Execute Tools in parallel
    const executionPromises = currentToolCalls.map(async (tool) => {
      try {
        const result = await executeToolLocally(tool.name, tool.args);
        tool.result = result;
        tool.status = 'success';
        return {
          id: tool.name === 'googleSearch' ? 'search-id' : tool.id, // ID matching isn't strict for simulated local logic but strict for API
          name: tool.name,
          response: { result }
        };
      } catch (err: any) {
        tool.result = { error: err.message };
        tool.status = 'error';
        return {
          id: tool.id,
          name: tool.name,
          response: { error: err.message }
        };
      }
    });

    const functionResponses = await Promise.all(executionPromises);

    // Notify UI that tools finished
    if (onToolCallComplete) onToolCallComplete([...currentToolCalls]);

    // 3. Send results back to Gemini
    // We must send the FunctionResponse parts back
    const responseParts: any[] = functionResponses.map(fr => ({
      functionResponse: {
        name: fr.name,
        response: fr.response.result // The SDK expects the result object directly inside response
      }
    }));

    // For gemini-2.5-flash and newer SDKs, we might need to match the exact structure.
    // The chat session handles history, so we just send the response parts.
    // NOTE: The SDK `sendMessage` handles `Content` objects.
    // We need to construct a Content object with role 'function' (or 'user' in some contexts, but usually 'function' response is implicit in turn structure).
    // Actually, in the new SDK `chats.create`, we continue the conversation by sending the function responses.
    
    response = await chatSession.sendMessage(responseParts);
    
    return {
      text: response.text || "",
      toolCalls: currentToolCalls, // Return the tool calls so they can be rendered in history
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};