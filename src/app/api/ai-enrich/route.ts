import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface EnrichmentRequest {
  companyName: string;
  companyEmail: string;
}

async function searchGoogle(query: string): Promise<string[]> {
  const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

  if (!SERPAPI_KEY) {
    throw new Error("SerpAPI key not configured");
  }

  try {
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
        query
      )}&api_key=${SERPAPI_KEY}&num=5`
    );

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();
    const results: string[] = [];

    if (data.organic_results) {
      for (const item of data.organic_results) {
        const snippet = `${item.title}: ${
          item.snippet || item.description || ""
        } (${item.link})`;
        results.push(snippet);
      }
    }

    return results;
  } catch (error) {
    console.error("SerpAPI search error:", error);
    return [];
  }
}

async function generateSummary(
  companyName: string,
  companyEmail: string,
  searchResults: string[]
): Promise<{
  fullResponse: string;
  summary: string;
  priority: boolean;
  reasoning: string;
}> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY?.trim();

  if (!ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key not configured");
  }

  // Validate API key format
  if (!ANTHROPIC_API_KEY.startsWith("sk-ant-")) {
    throw new Error("Invalid Anthropic API key format");
  }

  // Debug: Log the first and last few characters of the API key (safely)
  console.log("API Key starts with:", ANTHROPIC_API_KEY.substring(0, 10));
  console.log(
    "API Key ends with:",
    ANTHROPIC_API_KEY.substring(ANTHROPIC_API_KEY.length - 4)
  );
  console.log("API Key length:", ANTHROPIC_API_KEY.length);

  const domain = companyEmail.split("@")[1];
  const searchContext = searchResults.join("\n\n");

  const prompt = `Based on the following search results, provide a comprehensive summary about ${companyName} (domain: ${domain}) and determine if this is a high-priority sales prospect.

Search results:
${searchContext}

Please provide:
1. A detailed summary covering:
   - What the company does
   - Key products/services
   - Company size and location if available
   - Recent news or developments
   - Funding information if available
   - Any relevant business information

2. Then, determine if this is a HIGH PRIORITY prospect for immediate outreach based on these criteria:
   - Fast-growing startups
   - Companies that have raised significant funding (Series A+ or $5M+)
   - Companies with high revenue or market presence
   - Companies frequently in the news or trending
   - Innovative/disruptive companies in hot sectors (AI, fintech, etc.)
   - Large enterprises (1000+ employees)

Format your response as:
SUMMARY: [your detailed summary here]

PRIORITY: YES/NO
REASONING: [brief explanation of why yes or no]

Keep the summary factual and well-structured, around 200-300 words.`;

  try {
    console.log("Using x-api-key header for authentication");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error ${response.status}:`, errorText);

      if (response.status === 401) {
        throw new Error(
          "Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY environment variable."
        );
      }

      if (response.status === 429) {
        // Try to parse the error for more details
        let errorDetails = "";
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error?.message || errorText;
        } catch {
          errorDetails = errorText;
        }
        throw new Error(`Claude rate limit exceeded: ${errorDetails}`);
      }

      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Anthropic response:", JSON.stringify(data, null, 2));

    const fullResponse = data.content[0]?.text || "Unable to generate summary";
    console.log("Full response text:", fullResponse);

    // Parse the structured response
    const summaryMatch = fullResponse.match(
      /SUMMARY:\s*([\s\S]*?)(?=PRIORITY:|$)/
    );
    const priorityMatch = fullResponse.match(/PRIORITY:\s*(YES|NO)/i);
    const reasoningMatch = fullResponse.match(/REASONING:\s*([\s\S]*?)$/);

    console.log("Parsed results:", {
      summaryMatch: !!summaryMatch,
      priorityMatch: !!priorityMatch,
      reasoningMatch: !!reasoningMatch,
    });

    return {
      fullResponse,
      summary: summaryMatch?.[1]?.trim() || fullResponse,
      priority: priorityMatch?.[1]?.toUpperCase() === "YES",
      reasoning: reasoningMatch?.[1]?.trim() || "",
    };
  } catch (error) {
    console.error("Anthropic error:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: EnrichmentRequest = await req.json();
    const { companyName, companyEmail } = body;

    if (!companyName || !companyEmail) {
      return NextResponse.json(
        { error: "Company name and email are required" },
        { status: 400 }
      );
    }

    // Extract domain for more targeted search
    const domain = companyEmail.split("@")[1];
    const searchQuery = `${companyName} company ${domain} business`;

    // Search Google for company information
    console.log(`[AI-Enrich] Searching for: ${searchQuery}`);
    const searchResults = await searchGoogle(searchQuery);

    if (searchResults.length === 0) {
      return NextResponse.json(
        { error: "No search results found for the company" },
        { status: 404 }
      );
    }

    // Generate AI summary
    console.log(`[AI-Enrich] Generating summary for ${companyName}`);
    let aiResult: { summary: string; priority: boolean; reasoning: string };

    try {
      const fullResult = await generateSummary(
        companyName,
        companyEmail,
        searchResults
      );
      aiResult = {
        summary: fullResult.summary,
        priority: fullResult.priority,
        reasoning: fullResult.reasoning,
      };
    } catch (error) {
      console.warn(`[AI-Enrich] AI summary failed, using fallback:`, error);
      // Fallback: create a basic summary from search results
      const firstResults = searchResults.slice(0, 3);
      aiResult = {
        summary: `Based on search results for ${companyName}:\n\n${firstResults
          .map(
            (result) =>
              `• ${result.split(":")[1]?.split("(")[0]?.trim() || result}`
          )
          .join("\n\n")}`,
        priority: false,
        reasoning: "Unable to assess priority due to AI processing error",
      };
    }

    // Extract source URLs from search results
    const sources = searchResults
      .map((result) => {
        const match = result.match(/\((https?:\/\/[^)]+)\)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    const response = NextResponse.json({
      summary: aiResult.summary,
      priority: aiResult.priority,
      reasoning: aiResult.reasoning,
      sources,
    });

    // Disable caching
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");

    return response;
  } catch (error) {
    console.error("[AI-Enrich] Error:", error);
    const response = NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );

    // Disable caching for error responses too
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  }
}

export async function GET() {
  const response = NextResponse.json({
    ok: true,
    message: "AI enrichment endpoint alive",
  });

  // Disable caching
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}
