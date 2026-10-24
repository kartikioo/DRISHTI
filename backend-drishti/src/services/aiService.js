import axios from 'axios';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Drishti Provider-Independent AI Vision Service
 * Supports Google Gemini, OpenAI Vision, Anthropic Claude, and Ollama.
 */

let sessionApiKey = ENV.AI_API_KEY || '';

// Helper to construct accessibility-focused prompts based on mode
const buildModePrompt = (mode, customPrompt = '') => {
  const baseInstructions = `
You are DRISHTI ("Eyes for the Blind"), an expert AI accessibility assistant for visually impaired and blind users.
Analyze the provided camera image with extreme precision, high spatial awareness, and accessibility empathy.

CRITICAL INSTRUCTIONS:
1. Speak directly, respectfully, and helpfully to the user.
2. Provide explicit spatial directions using relative locations and clock face positions (e.g., "12 o'clock straight ahead 3 feet", "2 o'clock to your forward right", "9 o'clock to your immediate left").
3. Warn immediately of any physical dangers, drop-offs, stairs, or tripping hazards.
4. If ANY text, signs, labels, book pages, or medicine containers are visible, extract the text accurately into "detectedText" AND read it aloud in "audioTranscript".
5. Identify people count and common surrounding everyday objects (e.g., laptops, water bottles, chargers, cups, keyboards, chairs, smartphones).
6. Respond strictly in valid JSON format with the following keys:
{
  "summary": "1 or 2 concise, clear sentences describing the main scene for instant text-to-speech audio.",
  "detailedDescription": "A comprehensive description of the surroundings, layout, lighting, people count, and spatial depth.",
  "detectedText": "Any written words, signs, product labels, book pages, medicine names, or numbers detected in the image (or empty string if none).",
  "detectedObjects": [
    { "name": "object name (e.g. laptop, water bottle, charger, person, keys, cup)", "position": "spatial location", "distance": "approximate distance (e.g. 2 feet)", "clockPosition": "12 o'clock / 2 o'clock / etc." }
  ],
  "peopleCount": 0,
  "peopleDetails": "Count and spatial positions of any people in view (or 'No people detected').",
  "currencyDetails": {
    "isCurrencyDetected": false,
    "totalValue": 0,
    "currencyUnit": "INR",
    "breakdown": [],
    "items": []
  },
  "hazards": [
    { "type": "hazard description", "severity": "low|medium|high|critical", "advice": "immediate action to take" }
  ],
  "navigationAdvice": "Actionable guidance for safe movement (e.g. 'Floor is clear for 4 feet, then pivot slightly right').",
  "audioTranscript": "A natural, friendly speech transcript designed for text-to-speech playback that speaks the most important details smoothly, including reading text, currency totals, or obstacle warnings."
}
Do NOT include markdown formatting outside the JSON object.
`;

  let modeSpecific = '';
  switch (mode) {
    case 'general':
      modeSpecific = `
MODE: GENERAL SCENE, PEOPLE & LAYOUT SCANNER
CRITICAL GOALS:
1. PEOPLE COUNT & POSITIONS: Count the exact number of people surrounded by or near the user. Describe their position, distance, and activity (e.g. "There are 2 people near you: one sitting directly in front of you 3 feet away at a desk, and one standing to your left 4 feet away").
2. SURROUNDING OBJECTS INVENTORY: Identify everyday objects around the user, specifically looking for laptops, chargers, cables, water bottles, cups, notebooks, smartphones, chairs, and tables. Detail their positions.
3. ROOM & WALKWAY LAYOUT: Describe the physical layout, floor clearance, open pathways, doors, and walls.
4. IN audioTranscript: You MUST start by stating: "Scene overview: There are [X] people near you. Objects around you include [laptop, water bottle, charger, etc.] at [locations]. Layout: [open path / obstructed]. [summary]"`;
      break;

    case 'text':
      modeSpecific = `
MODE: MEDICINE PACKAGING & BOOK READING
CRITICAL RULES:
1. STRICT SUBJECT FOCUS: You are strictly reading text from MEDICINE PACKAGES, BOTTLES, BLISTER PACKS, or BOOKS.
2. IF MEDICINE OR BOOK IS VISIBLE:
   - Read the exact text on the medicine (medicine name, dosage e.g. 500mg, expiry date, instructions) or book (title, headings, lines).
   - In "detectedText": transcribe the exact text.
   - In "audioTranscript": start immediately with: "Medicine identified: [name], dosage [dosage], expiry [expiry date]. Instructions: [instructions]" or "The book text reads: [text]".
   - Speak ONLY what is written on the item. Do NOT describe unrelated background room surroundings or people!
3. IF NO MEDICINE PACKAGE OR BOOK IS VISIBLE:
   - YOU MUST NOT describe background furniture, people, walls, or rooms! DO NOT mention anything else!
   - Set "detectedText": ""
   - Set "summary": "Reading text in medicine and book cannot be detected."
   - Set "audioTranscript": "Reading text in medicine and book cannot be detected. Please hold the medicine package or book directly in front of the camera."`;
      break;

    case 'currency':
      modeSpecific = `
MODE: CURRENCY IDENTIFIER (BANKNOTES & COINS - SPECIALIZED FOR INDIAN RUPEES INR & GLOBAL CURRENCY)
CRITICAL GOALS:
1. IDENTIFY EACH COIN & BANKNOTE:
   - Coins: 1 Rupee coin, 2 Rupees coin, 5 Rupees coin, 10 Rupees coin, 20 Rupees coin.
   - Banknotes: 10 Rupees note, 20 Rupees note, 50 Rupees note, 100 Rupees note, 200 Rupees note, 500 Rupees note.
   (Also identify USD $, EUR €, GBP £ if shown).
2. CALCULATE TOTAL SUM: Sum up all detected coins and banknotes accurately. Populate "currencyDetails":
   { "isCurrencyDetected": true, "totalValue": 125, "currencyUnit": "INR", "breakdown": ["One 100 rupee note", "One 20 rupee note", "One 5 rupee coin"], "items": [] }
3. IN audioTranscript: YOU MUST STATE THE TOTAL VALUE FIRST! For example:
   "Total currency detected: 125 Rupees. You have: one 100 Rupee note, one 20 Rupee note, and one 5 Rupee coin."
4. If no currency is visible, set "isCurrencyDetected": false, "totalValue": 0, and state in audioTranscript: "No currency banknotes or coins detected. Please place the money flat and centered in front of the camera."`;
      break;

    case 'hazards':
      modeSpecific = `
MODE: SAFETY ALERT & HAZARD AVOIDANCE
CRITICAL GOALS:
1. EMERGENCY SAFETY SCAN: Scrutinize the path ahead, floor, steps, drop-offs, low-hanging cables, spills, sharp edges, open glass doors, or vehicles.
2. If hazards exist, assign severity ("critical", "high", "medium", "low") and provide urgent advice.
3. IN audioTranscript: Start with an immediate emergency warning: "Safety Alert: [hazard description] located [position]. Immediate action: [advice]." If clear: "Pathway is clear of immediate hazards."`;
      break;

    case 'find':
      modeSpecific = `
MODE: FIND TARGET OBJECT & CLOCK / WATCH TIME DETECTION
Target to find: "${customPrompt || 'clock, watch, keys, phone, cup, or charger'}"
CRITICAL RULES:
1. STRICT DETECTION - DO NOT GUESS OR HALLUCINATE:
   - If the requested target object is NOT visible in the camera frame:
     DO NOT invent a fake location or guess!
     Set "detectedObjects": []
     Set "summary": "${customPrompt && customPrompt.toLowerCase().includes('clock') ? 'Clock position cannot find.' : `${customPrompt || 'Target object'} cannot be found.`}"
     Set "audioTranscript": "${customPrompt && customPrompt.toLowerCase().includes('clock') ? 'Clock position cannot find. This object cannot be found in this view.' : `${customPrompt || 'Target object'} cannot be found. This object cannot be found in this view.`}"
2. IF TARGET IS A CLOCK / WATCH OR TIME:
   - If a wristwatch, wall clock, digital clock, or time display IS shown to the camera:
     YOU MUST DETECT AND SPEAK THE EXACT TIME! (e.g. "The watch shows 10:15 AM" or "Wall clock shows approximately 4:30") and state its position (e.g. "Watch is at 12 o'clock, 1 foot away").
3. IF TARGET OBJECT IS VISIBLE:
   - Give the exact clock face direction relative to the user:
     12 o'clock (straight ahead), 1-2 o'clock (forward right), 3 o'clock (right), 9 o'clock (left), 10-11 o'clock (forward left).
   - Specify distance (e.g. "2 feet away on the tabletop").
   - In "audioTranscript": State: "Found [target object]: located at your [clock position], approximately [distance] away."`;
      break;

    case 'people':
      modeSpecific = `
MODE: SOCIAL & PEOPLE RECOGNITION
Priority: Detect human presence, exact count of people, estimated distance, body posture, facial expressions, and whether someone is looking or walking toward the user.`;
      break;

    case 'qa':
      modeSpecific = `
MODE: DIRECT QUESTION & ANSWER
The user has asked the following specific question about their surroundings:
"${customPrompt || 'What is in front of me?'}"
Priority: Directly, accurately, and thoroughly answer the user's question first.`;
      break;

    default:
      modeSpecific = `
MODE: GENERAL SCENE EXPLORATION
Priority: Provide an overall spatial understanding of the room or outdoor environment, key objects, pathways, and atmosphere.`;
      break;
  }

  if (customPrompt && mode !== 'qa' && mode !== 'find') {
    modeSpecific += `\nAdditional user inquiry: "${customPrompt}"`;
  }

  return `${baseInstructions}\n${modeSpecific}`;
};

// Safe JSON parser from AI output
const extractAndParseJson = (rawText, mode = 'general', customPrompt = '') => {
  let result = {
    summary: 'Scene analyzed successfully.',
    detailedDescription: '',
    detectedText: '',
    detectedObjects: [],
    peopleCount: 0,
    peopleDetails: '',
    currencyDetails: {
      isCurrencyDetected: false,
      totalValue: 0,
      currencyUnit: 'INR',
      breakdown: [],
      items: []
    },
    hazards: [],
    navigationAdvice: '',
    audioTranscript: ''
  };

  try {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
    }
    const parsed = JSON.parse(cleaned);

    // Detected text sanitize
    let text = (parsed.detectedText && parsed.detectedText !== 'none' && parsed.detectedText !== 'null')
      ? parsed.detectedText.trim()
      : '';

    // Detected objects
    let objects = Array.isArray(parsed.detectedObjects) ? parsed.detectedObjects : [];
    // Ensure each object has clockPosition fallback if missing
    objects = objects.map((obj) => {
      if (typeof obj === 'string') return { name: obj, position: 'in front of you', distance: 'near', clockPosition: "12 o'clock" };
      let clock = obj.clockPosition;
      if (!clock && obj.position) {
        const pos = obj.position.toLowerCase();
        if (pos.includes('left')) clock = pos.includes('front') || pos.includes('forward') ? "10 o'clock" : "9 o'clock";
        else if (pos.includes('right')) clock = pos.includes('front') || pos.includes('forward') ? "2 o'clock" : "3 o'clock";
        else clock = "12 o'clock";
      }
      return {
        ...obj,
        clockPosition: clock || "12 o'clock"
      };
    });

    // People count
    let peopleCount = typeof parsed.peopleCount === 'number' ? parsed.peopleCount : 0;
    if (peopleCount === 0 && Array.isArray(parsed.detectedObjects)) {
      peopleCount = parsed.detectedObjects.filter((o) => {
        const name = (typeof o === 'string' ? o : o.name || '').toLowerCase();
        return name.includes('person') || name.includes('man') || name.includes('woman') || name.includes('child') || name.includes('student');
      }).length;
    }

    result = {
      summary: parsed.summary || 'Scene analyzed successfully.',
      detailedDescription: parsed.detailedDescription || parsed.summary || '',
      detectedText: text,
      detectedObjects: objects,
      peopleCount: peopleCount,
      peopleDetails: parsed.peopleDetails || (peopleCount > 0 ? `${peopleCount} person(s) nearby.` : 'No people detected.'),
      currencyDetails: parsed.currencyDetails && typeof parsed.currencyDetails === 'object' ? parsed.currencyDetails : {
        isCurrencyDetected: false,
        totalValue: 0,
        currencyUnit: 'INR',
        breakdown: [],
        items: []
      },
      hazards: Array.isArray(parsed.hazards) ? parsed.hazards : [],
      navigationAdvice: parsed.navigationAdvice || '',
      audioTranscript: parsed.audioTranscript || parsed.summary || ''
    };
  } catch (error) {
    logger.warn('Failed to parse AI response as JSON, falling back to structured text extraction', {
      error: error.message
    });
    result = {
      summary: rawText.slice(0, 180),
      detailedDescription: rawText,
      detectedText: '',
      detectedObjects: [],
      peopleCount: 0,
      peopleDetails: 'No people count available.',
      currencyDetails: { isCurrencyDetected: false, totalValue: 0, currencyUnit: 'INR', breakdown: [], items: [] },
      hazards: [],
      navigationAdvice: 'Proceed with caution.',
      audioTranscript: rawText.slice(0, 300)
    };
  }

  // GUARANTEES based on Mode:
  const hasText = result.detectedText && result.detectedText.trim().length > 0;

  if (mode === 'text') {
    if (hasText) {
      const textToRead = result.detectedText.trim();
      const snippet = textToRead.slice(0, 25).toLowerCase();
      if (!result.audioTranscript.toLowerCase().includes(snippet)) {
        if (/(mg|tablet|capsule|dosage|syrup|expiry|pharma|exp:|rx|dose)/i.test(textToRead)) {
          result.audioTranscript = `Medicine identified: "${textToRead}".`;
        } else {
          result.audioTranscript = `The text reads: "${textToRead}".`;
        }
      }
    } else {
      // User requirement: If medicine package or book text cannot be seen, directly say:
      result.summary = 'Reading text in medicine and book cannot be detected.';
      result.audioTranscript = 'Reading text in medicine and book cannot be detected. Please hold the medicine package or book directly in front of the camera.';
      result.detectedText = '';
    }
  } else if (mode === 'find') {
    const targetQuery = (customPrompt || '').toLowerCase().trim();
    const isClockQuery = targetQuery.includes('clock') || targetQuery.includes('watch') || targetQuery.includes('time');

    // Check if target was found in detectedObjects or summary
    const foundTarget = result.detectedObjects.some((o) => {
      const name = (typeof o === 'string' ? o : o.name || '').toLowerCase();
      if (isClockQuery) return name.includes('clock') || name.includes('watch') || name.includes('time');
      if (targetQuery) {
        const cleanQuery = targetQuery.replace(/locate|find|my|the/gi, '').trim();
        return cleanQuery.length > 2 && name.includes(cleanQuery);
      }
      return false;
    });

    if (!foundTarget && targetQuery) {
      if (isClockQuery) {
        result.summary = 'Clock position cannot find.';
        result.audioTranscript = 'Clock position cannot find. This object cannot be found in this view. If you show a watch or clock, the time will be detected.';
        result.detectedObjects = [];
      } else {
        const cleanName = customPrompt.replace(/locate|find|my|the/gi, '').trim() || customPrompt;
        result.summary = `${cleanName} cannot be found.`;
        result.audioTranscript = `${cleanName} cannot be found. This object cannot be found in this view.`;
        result.detectedObjects = [];
      }
    }
  } else if (mode === 'currency') {
    if (result.currencyDetails && result.currencyDetails.isCurrencyDetected && result.currencyDetails.totalValue > 0) {
      const totalStr = `${result.currencyDetails.totalValue} ${result.currencyDetails.currencyUnit || 'Rupees'}`;
      if (!result.audioTranscript.includes(totalStr)) {
        const breakdownStr = result.currencyDetails.breakdown && result.currencyDetails.breakdown.length > 0
          ? ` Breakdown: ${result.currencyDetails.breakdown.join(', ')}.`
          : '';
        result.audioTranscript = `Total currency detected: ${totalStr}.${breakdownStr} ${result.summary || ''}`;
      }
    }
  } else if (mode === 'general') {
    const peopleMention = result.peopleCount > 0 ? `There are ${result.peopleCount} person(s) nearby.` : 'No people detected nearby.';
    if (!result.audioTranscript.toLowerCase().includes('people') && !result.audioTranscript.toLowerCase().includes('person')) {
      result.audioTranscript = `${peopleMention} ${result.audioTranscript}`;
    }
    if (hasText && !result.audioTranscript.toLowerCase().includes(result.detectedText.slice(0, 15).toLowerCase())) {
      result.audioTranscript += ` Visible text: "${result.detectedText}".`;
    }
  } else {
    if (hasText && !result.audioTranscript.toLowerCase().includes(result.detectedText.slice(0, 15).toLowerCase())) {
      result.audioTranscript += ` Visible text: "${result.detectedText}".`;
    }
  }

  return result;
};

let cachedWorkingGeminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent';

/**
 * Google Gemini Vision Implementation
 */
const callGeminiVision = async ({ base64Image, mimeType, prompt, apiKey, model, apiUrl }) => {
  let cleanModel = (model || 'gemini-flash-lite-latest').replace(/^models\//, '');
  
  // Map deprecated/legacy model names to active current generation
  if (['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-pro', 'gemini-1.0-pro', 'gemini-3.8-flash'].includes(cleanModel)) {
    cleanModel = 'gemini-flash-lite-latest';
  }

  // Build ordered list of candidate URLs to try
  const candidates = [];

  // 1. Cached proven working endpoint from previous successful call
  if (cachedWorkingGeminiUrl) {
    candidates.push(cachedWorkingGeminiUrl);
  }

  // 2. Direct verified active models on v1beta
  candidates.push(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent`);
  candidates.push(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`);
  candidates.push(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`);
  candidates.push(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`);
  candidates.push(`https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`);

  if (apiUrl && apiUrl.trim()) {
    let cleanUrl = apiUrl.trim().replace(/\/$/, '');
    if (cleanUrl.includes(':generateContent')) {
      candidates.unshift(cleanUrl);
    }
  }

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json'
    }
  };

  let lastError = null;

  for (const candidateBase of candidates) {
    const separator = candidateBase.includes('?') ? '&' : '?';
    const finalUrl = candidateBase.includes('key=') ? candidateBase : `${candidateBase}${separator}key=${encodeURIComponent(apiKey)}`;

    try {
      logger.info(`Attempting Gemini call to: ${candidateBase.split('?')[0]}`);
      const response = await axios.post(finalUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // Fast 10s timeout per candidate
      });

      const cand = response.data?.candidates;
      if (cand && cand.length > 0) {
        const rawText = cand[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          cachedWorkingGeminiUrl = candidateBase.split('?')[0];
          logger.info(`Gemini call succeeded with endpoint: ${cachedWorkingGeminiUrl}`);
          return rawText;
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message;
      lastError = err;
      logger.warn(`Gemini candidate endpoint failed (${candidateBase.split('?')[0]}): ${errMsg}`);

      // If it's an invalid API key, stop trying (the key is fundamentally invalid)
      if (errMsg.includes('API key not valid') || errMsg.includes('API_KEY_INVALID')) {
        throw new Error('API key not valid. Please verify your Google Gemini API key.');
      }

      // If it's a 404, not available, or timed out, continue immediately to next candidate
      continue;
    }
  }

  // Dynamic model discovery via ListModels if static candidates fail
  try {
    logger.info('Attempting dynamic model discovery via ListModels API...');
    for (const ver of ['v1beta', 'v1']) {
      try {
        const listUrl = `https://generativelanguage.googleapis.com/${ver}/models?key=${encodeURIComponent(apiKey)}`;
        const listRes = await axios.get(listUrl, { timeout: 6000 });
        const availableModels = listRes.data?.models || [];
        const supported = availableModels.filter(m => 
          m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
        );

        // Sort to prioritize flash-lite and flash models
        supported.sort((a, b) => {
          if (a.name.includes('flash-lite')) return -1;
          if (b.name.includes('flash-lite')) return 1;
          if (a.name.includes('flash')) return -1;
          if (b.name.includes('flash')) return 1;
          return 0;
        });

        for (const modelItem of supported) {
          try {
            const modelPath = modelItem.name.startsWith('models/') ? modelItem.name : `models/${modelItem.name}`;
            const dynamicUrl = `https://generativelanguage.googleapis.com/${ver}/${modelPath}:generateContent?key=${encodeURIComponent(apiKey)}`;
            
            logger.info(`Testing dynamically discovered model ${modelPath} on ${ver}...`);
            const response = await axios.post(dynamicUrl, payload, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000
            });

            const cand = response.data?.candidates;
            if (cand && cand.length > 0) {
              const rawText = cand[0]?.content?.parts?.[0]?.text;
              if (rawText) {
                cachedWorkingGeminiUrl = `https://generativelanguage.googleapis.com/${ver}/${modelPath}:generateContent`;
                logger.info(`Dynamic model discovery succeeded with ${modelPath} on ${ver}!`);
                return rawText;
              }
            }
          } catch (itemErr) {
            logger.warn(`Model ${modelItem.name} on ${ver} failed: ${itemErr.message}`);
          }
        }
      } catch (verErr) {
        logger.warn(`Failed to list models on ${ver}: ${verErr.message}`);
      }
    }
  } catch (discoveryErr) {
    logger.warn('Dynamic model discovery exception:', { error: discoveryErr.message });
  }

  const finalErrMsg = lastError?.response?.data?.error?.message || lastError?.message || 'Gemini Vision Analysis failed';
  throw new Error(`AI Vision Analysis failed (gemini): ${finalErrMsg}`);
};

/**
 * OpenAI Vision Compatible Implementation (Works with OpenAI GPT-4o, Groq, OpenRouter)
 */
const callOpenAiVision = async ({ base64Image, mimeType, prompt, apiKey, model, apiUrl }) => {
  const modelName = model || 'gpt-4o-mini';
  let url = apiUrl && apiUrl.trim() ? apiUrl.trim() : 'https://api.openai.com/v1/chat/completions';
  if (apiUrl && !url.includes('/chat/completions')) {
    url = `${url.replace(/\/$/, '')}/chat/completions`;
  }

  const imageUrl = `data:${mimeType || 'image/jpeg'};base64,${base64Image}`;

  const payload = {
    model: modelName,
    messages: [
      {
        role: 'system',
        content: 'You are DRISHTI, an AI visual assistant for the visually impaired. You must respond in valid JSON format.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'high' }
          }
        ]
      }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1500,
    temperature: 0.3
  };

  const response = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    timeout: 35000
  });

  const rawText = response.data?.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error('OpenAI Vision returned empty response');
  }

  return rawText;
};

/**
 * Anthropic Claude 3.5 Vision Implementation
 */
const callClaudeVision = async ({ base64Image, mimeType, prompt, apiKey, model, apiUrl }) => {
  const modelName = model || 'claude-3-5-sonnet-20241022';
  const url = apiUrl || 'https://api.anthropic.com/v1/messages';

  const payload = {
    model: modelName,
    max_tokens: 2000,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType || 'image/jpeg',
              data: base64Image
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }
    ]
  };

  const response = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    timeout: 35000
  });

  const rawText = response.data?.content?.[0]?.text;
  if (!rawText) {
    throw new Error('Claude Vision returned empty response');
  }

  return rawText;
};

/**
 * Main Provider-Independent AI Service Function
 */
export const aiService = {
  /**
   * Analyze an image buffer or base64 string
   */
  async analyzeImage({
    imageBuffer,
    base64Data,
    mimeType = 'image/jpeg',
    mode = 'general',
    customPrompt = '',
    overrideApiKey = null,
    overrideProvider = null,
    overrideModel = null
  }) {
    const startTime = Date.now();
    
    // Normalize image base64
    let base64Image = base64Data;
    if (!base64Image && imageBuffer) {
      base64Image = imageBuffer.toString('base64');
    }

    if (!base64Image) {
      throw new Error('No image data provided for vision analysis');
    }

    // Strip data URI prefix if present
    if (base64Image.includes('base64,')) {
      base64Image = base64Image.split('base64,')[1];
    }

    // Resolve Provider, Key, and Model
    const provider = (overrideProvider || ENV.AI_PROVIDER || 'gemini').toLowerCase();
    let apiKey = overrideApiKey || sessionApiKey || ENV.AI_API_KEY;
    if (overrideApiKey && overrideApiKey.trim().length > 5) {
      sessionApiKey = overrideApiKey.trim();
    }
    const model = overrideModel || ENV.AI_MODEL || 'gemini-flash-lite-latest';
    const apiUrl = ENV.AI_API_URL;

    // Check if API key is present
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_')) {
      logger.warn('AI API key is missing or not configured.');
      throw new Error(
        'AI_API_KEY is not configured in backend/.env. Please configure your Gemini or OpenAI API key in backend/.env or under Drishti Settings to enable real vision processing.'
      );
    }

    logger.info(`Starting vision analysis with provider: ${provider}, model: ${model}, mode: ${mode}`);
    const prompt = buildModePrompt(mode, customPrompt);

    let rawOutput = '';
    try {
      if (provider === 'gemini') {
        rawOutput = await callGeminiVision({
          base64Image,
          mimeType,
          prompt,
          apiKey,
          model,
          apiUrl
        });
      } else if (provider === 'openai' || provider === 'groq' || provider === 'openrouter') {
        rawOutput = await callOpenAiVision({
          base64Image,
          mimeType,
          prompt,
          apiKey,
          model,
          apiUrl
        });
      } else if (provider === 'claude' || provider === 'anthropic') {
        rawOutput = await callClaudeVision({
          base64Image,
          mimeType,
          prompt,
          apiKey,
          model,
          apiUrl
        });
      } else {
        throw new Error(`Unsupported AI provider: ${provider}. Supported providers: gemini, openai, claude`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      logger.error('AI Provider API call failed', { provider, error: errMsg });
      throw new Error(`AI Vision Analysis failed (${provider}): ${errMsg}`);
    }

    const structuredData = extractAndParseJson(rawOutput, mode, customPrompt);
    const latencyMs = Date.now() - startTime;

    return {
      ...structuredData,
      aiProvider: provider,
      aiModel: model,
      latencyMs,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Health check for AI service configuration
   */
  getStatus() {
    return {
      provider: ENV.AI_PROVIDER,
      model: ENV.AI_MODEL,
      isConfigured: ENV.isAiConfigured(),
      keyLength: ENV.AI_API_KEY ? ENV.AI_API_KEY.length : 0
    };
  }
};
