import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function GET() {
  try {
    console.log('Testing OpenAI API...');
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 20));
    
    // Simple test call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Say "Hello, API is working!"' }
      ],
      max_tokens: 50,
    });

    const response = completion.choices[0]?.message?.content;
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI API is working!',
      response,
      model: completion.model,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error('OpenAI Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.type,
      code: error.code,
      status: error.status,
      details: error.toString(),
    }, { status: 500 });
  }
}

