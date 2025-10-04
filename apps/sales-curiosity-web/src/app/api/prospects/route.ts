import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get('origin') || '';
    if (!isAllowedOrigin(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders(origin) });
    }
    // Placeholder: fetch prospects (later from DB/3rd party)
    return NextResponse.json({ ok: true, prospects: [] }, { headers: corsHeaders(origin) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin') || '';
    if (!isAllowedOrigin(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders(origin) });
    }

    const body = await req.json();
    const { profileData, linkedinUrl } = body;

    if (!profileData) {
      return NextResponse.json(
        { error: 'profileData is required' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Build context from all available data
    let contextText = '';
    
    if (profileData.name) contextText += `Name: ${profileData.name}\n`;
    if (profileData.headline) contextText += `Headline: ${profileData.headline}\n`;
    if (profileData.location) contextText += `Location: ${profileData.location}\n\n`;
    
    if (profileData.aboutSection) {
      contextText += `About:\n${profileData.aboutSection}\n\n`;
    }
    
    if (profileData.experienceSection) {
      contextText += `Experience:\n${profileData.experienceSection}\n\n`;
    }
    
    if (profileData.educationSection) {
      contextText += `Education:\n${profileData.educationSection}\n\n`;
    }
    
    if (profileData.skillsSection) {
      contextText += `Skills:\n${profileData.skillsSection}\n\n`;
    }
    
    // Add full page text if sections weren't extracted
    if (!profileData.aboutSection && !profileData.experienceSection && profileData.fullPageText) {
      contextText += `Profile Content:\n${profileData.fullPageText.substring(0, 8000)}\n`;
    }

    console.log('Building AI prompt with context length:', contextText.length);

    // Create a prompt for AI analysis
    const prompt = `You are an expert sales intelligence assistant. Analyze this LinkedIn profile and provide insightful, actionable intelligence for a sales professional.

${contextText}

Based on this LinkedIn profile information, please provide:

**1. Executive Summary**
A brief 2-3 sentence overview of who this person is professionally and what makes them interesting.

**2. Key Insights**
3-5 notable observations about their career, expertise, industry position, or professional background.

**3. Sales Angles**
Specific talking points, shared interests, or connection opportunities that would be valuable for outreach.

**4. Potential Pain Points**
Based on their role and industry, what challenges might they be facing that your product/service could address?

**5. Conversation Starters**
2-3 personalized, natural opening lines you could use to start a conversation or send a connection request.

Be specific and actionable. If information is limited, focus on what you can infer from the available data.`;

    // Check if we should use mock mode
    const useMock = process.env.USE_MOCK_AI === '1' || process.env.NEXT_PUBLIC_MOCK_AI === '1';
    
    let analysis: string;

    if (useMock) {
      console.log('🧪 Using MOCK AI response (set USE_MOCK_AI=0 to use real OpenAI)');
      
      // Generate a realistic mock response based on the data we have
      analysis = `**1. Executive Summary**
${profileData.name || 'This professional'} is ${profileData.headline || 'a professional in their field'}${profileData.location ? ` based in ${profileData.location}` : ''}. They appear to be an experienced professional with a strong background in their industry.

**2. Key Insights**
• Current role suggests leadership experience and strategic thinking
• ${profileData.location ? `Located in ${profileData.location}, which is a major business hub` : 'Operating in a key market area'}
• Active LinkedIn presence with professional networking (${profileData.headline ? 'clearly defined professional identity' : 'established career trajectory'})
• Experience in ${profileData.headline?.includes('AI') ? 'cutting-edge AI/technology sector' : profileData.headline?.includes('healthcare') ? 'healthcare innovation' : 'their specialized field'}
• Likely decision-maker or influencer in their organization

**3. Sales Angles**
• Innovation focus: If in tech/AI, they value cutting-edge solutions
• Efficiency and ROI: Leadership roles prioritize business outcomes
• Industry expertise: They understand sector-specific challenges
• Growth mindset: Active professionals are open to new opportunities
• Network effects: Well-connected professionals can become advocates

**4. Potential Pain Points**
• Scaling challenges as the business grows
• Need for operational efficiency and automation
• Staying competitive in a rapidly evolving market
• Managing team productivity and collaboration
• Balancing innovation with practical implementation
• ROI pressure from stakeholders or investors

**5. Conversation Starters**
• "I noticed you're working on ${profileData.headline ? profileData.headline.split('|')[0].trim() : 'innovative projects'} - I'd love to hear about the biggest challenges you're tackling in that space."

• "${profileData.location ? `I see you're in ${profileData.location} - ` : ''}I've been working with similar ${profileData.headline?.includes('CMO') ? 'marketing leaders' : profileData.headline?.includes('CEO') ? 'executives' : 'professionals'} who've shared some interesting insights about [specific challenge]. Would love to compare notes."

• "Your background in ${profileData.headline ? profileData.headline.toLowerCase().includes('ai') ? 'AI and innovation' : profileData.headline.toLowerCase().includes('healthcare') ? 'healthcare tech' : 'your field' : 'your industry'} is impressive. I'm curious - how are you approaching [relevant industry challenge]?"

---
*Note: This is a MOCK response generated for testing. To use real AI analysis, add OpenAI credits and set USE_MOCK_AI=0 in your .env.local file.*`;
    } else {
      console.log('Sending to OpenAI for analysis...');
      console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
      console.log('OpenAI API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 10));
      console.log('Context text length:', contextText.length);

      // Call OpenAI for analysis
      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert sales intelligence analyst who provides deep, actionable insights about prospects based on their LinkedIn profiles.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        });
      } catch (openaiError: any) {
        console.error('OpenAI API Error:', {
          message: openaiError.message,
          type: openaiError.type,
          code: openaiError.code,
          status: openaiError.status,
          error: openaiError.error,
        });
        throw new Error(`OpenAI API failed: ${openaiError.message || openaiError.toString()}`);
      }

      analysis = completion.choices[0]?.message?.content || 'No analysis generated';
      console.log('Analysis complete, length:', analysis.length);
    }

    // Save analysis to database (if user is authenticated)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('Saving analysis to database for user:', user.id);
        
        const { error: insertError } = await supabase
          .from('linkedin_analyses')
          .insert({
            user_id: user.id,
            linkedin_url: linkedinUrl,
            profile_name: profileData.name,
            profile_headline: profileData.headline,
            profile_location: profileData.location,
            profile_data: profileData,
            ai_analysis: analysis,
          });

        if (insertError) {
          console.error('Error saving analysis:', insertError);
        } else {
          console.log('Analysis saved successfully');
        }
      } else {
        console.log('No authenticated user, skipping database save');
      }
    } catch (dbError) {
      console.error('Database save error:', dbError);
      // Don't throw - we still want to return the analysis even if save fails
    }

    return NextResponse.json(
      {
        ok: true,
        analysis,
        profileData: {
          name: profileData.name,
          headline: profileData.headline,
          location: profileData.location,
          url: linkedinUrl,
        },
      },
      { headers: corsHeaders(origin) }
    );
  } catch (err) {
    console.error('Error analyzing prospect:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(err) },
      { status: 500, headers: corsHeaders() }
    );
  }
}

function isAllowedOrigin(origin: string) {
  const allowed = ['chrome-extension://', process.env.NEXT_PUBLIC_APP_URL || '', 'https://your-app.vercel.app'];
  return allowed.some((prefix) => origin.startsWith(prefix));
}

function corsHeaders(origin?: string) {
  const o = origin || '*';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  } as Record<string, string>;
}


