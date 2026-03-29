import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOPIC_NAMES: Record<string, string> = {
  climate_change: "Climate Change",
  pollution: "Pollution & Waste",
  waste: "Waste Management",
  energy: "Renewable Energy",
  water: "Water Conservation",
  biodiversity: "Biodiversity",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topic } = await req.json();
    if (!topic || !TOPIC_NAMES[topic]) {
      return new Response(JSON.stringify({ error: "Invalid topic" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch lesson content for context
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fast path: return cached quiz if available.
    const { data: cachedQuiz } = await adminClient
      .from("quiz_generation_cache")
      .select("questions")
      .eq("topic", topic)
      .maybeSingle();

    if (cachedQuiz?.questions && Array.isArray(cachedQuiz.questions)) {
      return new Response(JSON.stringify({ questions: cachedQuiz.questions, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: lessons } = await adminClient
      .from("lessons")
      .select("title, summary, body")
      .eq("topic", topic)
      .order("order_index");

    const articleContent = (lessons || [])
      .map((l: any) => `Title: ${l.title}\nSummary: ${l.summary}\n${l.body}`)
      .join("\n\n---\n\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const topicName = TOPIC_NAMES[topic];
    const systemPrompt = `You are an expert environmental educator creating quiz questions based on specific article content provided to you. Questions MUST be based on the provided content.`;

    const userPrompt = `Here is the article content about ${topicName}:

${articleContent}

Based ONLY on the above content, generate exactly 7 quiz questions: 3 multiple choice, 2 true/false, and 2 fill-in-the-blank.

CRITICAL RULES:
- For true_false questions, the answer MUST be exactly "True" or "False" (nothing else, no extra text)
- For mcq questions, provide exactly 4 options and the answer must match one option exactly
- For fill_blank questions, the answer should be a single word or short phrase
- All questions must directly relate to facts from the provided article content`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_quiz_questions",
              description: "Generate a structured quiz with 7 questions about environmental topics",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["mcq", "true_false", "fill_blank"],
                        },
                        question: { type: "string" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          description: "4 options for MCQ, ['True', 'False'] for true_false, omit for fill_blank",
                        },
                        answer: {
                          type: "string",
                          description: "For true_false: exactly 'True' or 'False'. For mcq: exact match of one option.",
                        },
                        explanation: { type: "string" },
                      },
                      required: ["type", "question", "answer", "explanation"],
                      additionalProperties: false,
                    },
                    minItems: 7,
                    maxItems: 7,
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_quiz_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate quiz" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(aiResponse));
      return new Response(JSON.stringify({ error: "Invalid AI response format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const quizData = JSON.parse(toolCall.function.arguments);

    // Normalize answers - especially true/false
    const normalizedQuestions = quizData.questions.map((q: any) => {
      if (q.type === "true_false") {
        const lower = (q.answer || "").toLowerCase().trim();
        q.answer = lower.startsWith("true") ? "True" : "False";
        q.options = ["True", "False"];
      }
      // Trim all answers
      q.answer = (q.answer || "").trim();
      return q;
    });

    await adminClient
      .from("quiz_generation_cache")
      .upsert(
        {
          topic,
          questions: normalizedQuestions,
          source: "ai",
        },
        { onConflict: "topic" }
      );

    return new Response(JSON.stringify({ questions: normalizedQuestions, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-quiz error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
