import { NextRequest, NextResponse } from 'next/server';

// Access tokens from environment variables
const GEMINI_ACCESS_TOKEN = process.env.GEMINI_ACCESS_TOKEN;
const PERPLEXITY_ACCESS_TOKEN = process.env.PERPLEXITY_ACCESS_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { message, model } = await request.json();

    // Validate request
    if (!message || !model) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    let response;
    
    // Call the appropriate AI model API
    try {
      if (model === 'gemini') {
        if (!GEMINI_ACCESS_TOKEN) {
          console.error('Gemini API token is not configured');
          return NextResponse.json(
            { error: 'API configuration error' },
            { status: 500 }
          );
        }
        response = await callGeminiAPI(message, GEMINI_ACCESS_TOKEN);
      } else if (model === 'perplexity') {
        if (!PERPLEXITY_ACCESS_TOKEN) {
          console.error('Perplexity API token is not configured');
          return NextResponse.json(
            { error: 'API configuration error' },
            { status: 500 }
          );
        }
        response = await callPerplexityAPI(message, PERPLEXITY_ACCESS_TOKEN);
      } else {
        return NextResponse.json(
          { error: 'Invalid model specified' },
          { status: 400 }
        );
      }
    } catch (apiError: any) {
      console.error(`Error calling ${model} API:`, apiError.message);
      return NextResponse.json(
        { error: `Failed to get response from ${model}: ${apiError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error processing AI request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Function to call Gemini API
async function callGeminiAPI(message: string, apiToken: string) {
  try {
    // Updated Google Gemini API endpoint - correct format for API requests
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiToken}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: message
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error details:', errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      throw new Error('Empty or invalid response from Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

// Function to call Perplexity API
async function callPerplexityAPI(message: string, apiToken: string) {
  // Define valid Perplexity models to try in order
  const perplexityModels = [
    'llama-3.1-sonar-small-128k-online',  // Main model - smaller but faster
    'llama-3.1-sonar-large-128k-online',  // Better quality but more expensive
    'llama-3.1-8b-instruct',              // Fallback to open-source model if online doesn't work
    'llama-3.1-70b-instruct'              // Last resort - larger open-source model
  ];
  
  let lastError = null;
  
  // Try each model in order until one works
  for (const model of perplexityModels) {
    try {
      console.log(`Trying Perplexity model: ${model}`);
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Perplexity API error with model ${model}:`, errorData);
        
        // If it's not a model error, don't try other models
        if (!errorData?.error?.message?.includes('Invalid model')) {
          throw new Error(`Perplexity API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
        }
        
        // Store the error but continue to the next model
        lastError = new Error(`Invalid model '${model}': ${errorData?.error?.message}`);
        continue;
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
        throw new Error('Empty or invalid response from Perplexity API');
      }
      
      console.log(`Successfully used Perplexity model: ${model}`);
      return data.choices[0].message.content;
    } catch (error: any) {
      // If this error is not about invalid model, rethrow it
      if (error.message && !error.message.includes('Invalid model')) {
        throw error;
      }
      
      // Otherwise store the error but continue to the next model
      lastError = error;
    }
  }
  
  // If we've tried all models and none worked, throw the last error
  console.error('All Perplexity models failed');
  throw lastError || new Error('Failed to get response from any Perplexity model');
} 