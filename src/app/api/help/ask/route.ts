import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HELP_DOCUMENTATION_KB } from '@/lib/help-documentation-kb';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY not set. AI help features will not work.");
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please provide a valid question.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Use Gemini to answer the question based on help documentation
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1000,
      }
    });

    const prompt = `You are a helpful AI assistant for the VoiceChat AI Platform. Your role is to answer questions about how to use the platform, configure settings, troubleshoot issues, and provide guidance based on the comprehensive help documentation below.

HELP DOCUMENTATION:
${HELP_DOCUMENTATION_KB}

USER QUESTION: ${question}

Please provide a clear, concise, and helpful answer based on the documentation above. If the question is not covered in the documentation, politely say so and suggest using the full help documentation or contacting support. Be friendly and professional. Format your response in a clear, readable way.

YOUR ANSWER:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    return NextResponse.json({
      success: true,
      answer: answer.trim()
    });

  } catch (error: any) {
    console.error('[Help AI API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate response. Please try again.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
