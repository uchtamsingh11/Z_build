# AI Assistant API

This API route securely handles requests to AI models without exposing API tokens in the frontend.

## Environment Setup

To configure the AI assistant properly, you need to set up environment variables with your API tokens:

1. Create a `.env.local` file in the root of your project (if it doesn't exist already)
2. Add the following environment variables:

```
# AI Model API Tokens
GEMINI_ACCESS_TOKEN=AIzaSyDPfMxPkHsHre9HJzgfLqC_fPBUJB4UXJc
PERPLEXITY_ACCESS_TOKEN=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
```

3. Make sure `.env.local` is in your `.gitignore` file to prevent committing sensitive tokens

## API Models

### Gemini API
- Model used: `gemini-1.5-pro`
- Documentation: [Google AI Studio](https://ai.google.dev/tutorials/rest_quickstart)
- Request parameters include temperature, topK, topP, and maxOutputTokens for response control

### Perplexity API
- Models used (in fallback order):
  1. `llama-3.1-sonar-small-128k-online` (Primary - faster, cheaper)
  2. `llama-3.1-sonar-large-128k-online` (Higher quality, more expensive)
  3. `llama-3.1-8b-instruct` (Open-source fallback)
  4. `llama-3.1-70b-instruct` (Larger open-source fallback)
- Documentation: [Perplexity API](https://docs.perplexity.ai/guides/model-cards)
- Pricing: [Perplexity Pricing](https://docs.perplexity.ai/guides/pricing)

## Fallback Mechanism

The API includes an automatic fallback system for Perplexity:
1. Tries to use the primary model first
2. If that fails with an "Invalid model" error, tries the next model in the list
3. Continues until it finds a working model or exhausts all options
4. Returns a clear error if all models fail

## Troubleshooting

### Common Issues:
1. **404 Errors**: Usually means incorrect API endpoint or model name
2. **401 Errors**: Invalid API key or authentication issue
3. **429 Errors**: Rate limiting (too many requests)

### Solutions:
- Verify API keys are correct and valid
- Check model names match what the API providers support
- Ensure proper request format according to each API's documentation
- Check server logs for detailed error messages

## Security Considerations

- NEVER store API tokens directly in your frontend code
- Always access tokens server-side in API routes
- Use environment variables for secure token storage
- For production, consider using a secret manager or vault service

## API Usage

The frontend interacts with this API by sending requests to:

```
/api/ai-assistant
```

with the following payload:

```json
{
  "message": "User's message here",
  "model": "gemini" or "perplexity"
}
```

The API will:
1. Handle authentication with the appropriate AI service
2. Send the message to the selected model
3. Return the response as `{ response: "AI response text" }`
4. Or return an error as `{ error: "Error message" }` 