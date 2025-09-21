/**
 * File: api.js
 * Description: Manages all communication with external APIs, including FreshService and Google Gemini.
 * Author: D.A.R.Y.L. & Taylor Giddens
 */

// --- API Functions ---
// This file contains all functions responsible for making external API calls
// to services like FreshService and Google Gemini.

/**
 * A robust JSON parser that cleans up common LLM-generated errors.
 * @param {string} text The raw text response from the API.
 * @returns {object} The parsed JSON object.
 */
function sanitizeAndParseJson(text) {
    try {
        // Attempt to find the JSON block if it's wrapped in markdown
        const match = text.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
        let jsonString = match ? (match[1] || match[2]) : text;

        // More robust sanitization:
        // Finds a backslash that is NOT followed by a valid JSON escape sequence,
        // and removes that single backslash. This corrects issues like an invalid `\#`.
        // Valid sequences are \", \\, \/, \b, \f, \n, \r, \t, or \uXXXX.
        jsonString = jsonString.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '');


        // Also, remove trailing commas from objects and arrays
        jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');


        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Failed to sanitize and parse JSON:", error);
        console.error("Original text:", text);
        // Re-throw a more informative error
        throw new Error(`Could not parse the API response as JSON, even after sanitization. Original error: ${error.message}`);
    }
}


/**
 * Fetches data from FreshService based on the selected extraction profile.
 */
async function fetchFreshServiceData(ticketId, domain, apiKey, profile) {
    const rateLimitDelay = parseInt(rateLimitDelayInput.value, 10) * 1000 || 60000;
    const maxAttempts = parseInt(maxRetriesInput.value, 10) || 5;
    let attempts = 0;

    while (attempts < maxAttempts) {
        if (isCancelled) return {
            ticketId,
            error: 'Operation cancelled by user.'
        };

        const credentials = btoa(`${apiKey}:X`);
        const headers = { "Authorization": `Basic ${credentials}` };
        const sanitizedDomain = domain.replace(/^https?:\/\//, '');

        const ticketUrl = `https://${sanitizedDomain}/api/v2/tickets/${ticketId}`;
        const convUrl = `https://${sanitizedDomain}/api/v2/tickets/${ticketId}/conversations`;

        try {
            const [ticketResponse, convResponse] = await Promise.all([
                fetch(ticketUrl, { headers }),
                fetch(convUrl, { headers })
            ]);

            if (ticketResponse.status === 429 || convResponse.status === 429) {
                console.warn(`FreshService rate limit hit for ticket #${ticketId}. Pausing for ${rateLimitDelay / 1000} seconds.`);

                // 1. Increment the API delay
                let currentApiDelay = parseInt(apiDelayInput.value, 10) || 200;
                currentApiDelay += 100;
                apiDelayInput.value = currentApiDelay;
                saveSettings(); // Persist the new delay and update localStorage
                console.log('Increasing API Call Delay to:', currentApiDelay, 'ms');


                // 2. Wait for the rate limit cooldown period
                await new Promise(resolve => setTimeout(resolve, rateLimitDelay));

                // 3. Continue to the next attempt for the same ticket
                attempts++;
                continue;
            }

            if (!ticketResponse.ok) throw new Error(`Ticket API Error: ${ticketResponse.status}`);
            if (!convResponse.ok) throw new Error(`Conversation API Error: ${convResponse.status}`);

            const ticketJson = await ticketResponse.json();
            const convJson = await convResponse.json();

            // Fetch requester details to get department_id
            let department_id = null;
            if (ticketJson.ticket && ticketJson.ticket.requester_id) {
                const requesterUrl = `https://${sanitizedDomain}/api/v2/requesters/${ticketJson.ticket.requester_id}`;
                const requesterResponse = await fetch(requesterUrl, { headers });
                if (requesterResponse.ok) {
                    const requesterJson = await requesterResponse.json();
                    if (requesterJson.requester && requesterJson.requester.department_ids && requesterJson.requester.department_ids.length > 0) {
                        department_id = requesterJson.requester.department_ids[0];
                    }
                } else {
                    console.warn(`Could not fetch requester details for ticket ${ticketId}. Status: ${requesterResponse.status}`);
                }
            }


            // 1. Apply privacy settings (scrubbing)
            const { ticket: privacyProcessedTicket, conversations: privacyProcessedConvos } = processPrivacy(ticketJson, convJson);

            // 2. Select schema and filter data
            const schema = (profile === 'light') ? lightExtractSchema : extendedExtractSchema;
            const finalTicketData = {
                ticket: filterObjectBySchema(privacyProcessedTicket, schema.ticket || {}),
                conversations: privacyProcessedConvos.map(convo => filterObjectBySchema(convo, schema.conversations || {}))
            };

            // 3. Assemble the final, enriched object
            const cleanTicketData = {
                ...finalTicketData, // Includes all schema-filtered data
                ticketId: ticketId,
                department_id: department_id, // Add the found department ID
                // Data for initial Gemini analysis
                analysisPayload: {
                    subject: finalTicketData.ticket.subject,
                    description: finalTicketData.ticket.description_text,
                    conversations: (finalTicketData.conversations || [])
                        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                        .map(convo => ({
                            author: convo.user_id === finalTicketData.ticket.requester_id ? "Customer" : "Support Agent",
                            body: convo.body_text
                        }))
                }
            };

            return cleanTicketData;


        } catch (error) {
            console.error(`Fetch error for ticket ${ticketId} on attempt ${attempts + 1}:`, error);
            attempts++;
            if (attempts >= maxAttempts) {
                return {
                    ticketId,
                    error: `API error after ${maxAttempts} attempts: ${error.message}`
                };
            }
            console.log(`Retrying fetch for ticket ${ticketId} (Attempt ${attempts + 1}/${maxAttempts})...`);
            // Use standard delay for generic errors, rateLimitDelay is handled above
            const standardApiDelay = parseInt(apiDelayInput.value, 10) || 200;
            await new Promise(resolve => setTimeout(resolve, standardApiDelay));
        }
    }

    return {
        ticketId,
        error: `Failed to fetch data for ticket ${ticketId} after ${maxAttempts} attempts.`
    };
}


/**
 * Sends single ticket data to Gemini for per-ticket analysis.
 */
async function analyzeTicketWithGemini(ticketInfo, geminiKey, selectedModel, modulesList, useCasesList) {
    // ... function content remains the same
    const rateLimitDelay = parseInt(rateLimitDelayInput.value, 10) * 1000 || 10000;
    const maxAttempts = parseInt(maxRetriesInput.value, 10) || 5;
    let attempts = 0;
    let currentDelay = rateLimitDelay;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`;

    const systemPrompt = `You are an expert product analyst reviewing a customer support ticket. Your task is to analyze the provided ticket data (in JSON format), which includes the subject, description, and conversation history, and then classify it according to the provided product modules and use cases.

Your response MUST be a valid JSON object with the following exact structure:
{
  "problem_summary": "<A concise, one-sentence summary of the customer's core problem.>",
  "product_module": "<The single most relevant product module from the provided list.>",
  "use_case": "<The single most relevant use case from the provided list.>"
}

RULES:
1.  Choose ONLY from the provided lists for 'product_module' and 'use_case'.
2.  If no suitable option exists in the lists, choose the closest one. Do not invent new ones.
3.  The output must be ONLY the JSON object, with no surrounding text, code fences, or explanations.`;

    const userPrompt = `Please analyze the following support ticket JSON data and classify it.

AVAILABLE PRODUCT MODULES:
${modulesList}

AVAILABLE USE CASES:
${useCasesList}

TICKET DATA:
---
${JSON.stringify(ticketInfo.analysisPayload, null, 2)}
---`;

    const payload = {
        "contents": [{
            "parts": [{
                "text": userPrompt
            }]
        }],
        "systemInstruction": {
            "parts": [{
                "text": systemPrompt
            }]
        },
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    };

    while (attempts < maxAttempts) {
        if (isCancelled) throw new Error("Operation cancelled by user.");

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn(`Gemini rate limit hit. Retrying in ${currentDelay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, currentDelay));
                    currentDelay *= 2; // Exponential backoff
                    attempts++;
                    continue;
                }
                const errorData = await response.json();
                throw new Error((errorData.error && errorData.error.message) || `Gemini API Error: ${response.status}`);
            }

            const result = await response.json();
            const candidate = result.candidates && result.candidates[0];
            const usage = result.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };

            if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0].text) {
                throw new Error("Invalid response structure from Gemini API.");
            }

            return {
                result: sanitizeAndParseJson(candidate.content.parts[0].text),
                usage: {
                    input: usage.promptTokenCount,
                    output: usage.candidatesTokenCount
                }
            };

        } catch (error) {
            if (error.message && error.message.toLowerCase().includes('exceeds the maximum number of tokens')) {
                throw error; // Re-throw immediately to stop retries for token limit errors
            }
            console.error(`Gemini analysis attempt ${attempts + 1} failed for ticket ${ticketInfo.ticketId}:`, error);
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error(`Gemini analysis failed after ${maxAttempts} attempts: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, currentDelay));
        }
    }
}

/**
 * Sends ticket data to Gemini for extended, in-depth analysis (for the modal).
 */
async function analyzeTicketForExtendedDetails(ticketInfo, geminiKey, selectedModel) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`;

    const systemPrompt = `You are a senior support engineer and product analyst. Your task is to provide a deeper analysis of a support ticket. Based on the provided ticket data, determine the likely root cause, suggest concrete next steps for the support agent, and propose potential preventative measures.

Your response MUST be a valid JSON object with the following exact structure:
{
  "root_cause": "<A detailed analysis of the underlying issue. If the root cause isn't clear, state what information is missing to determine it. Use bolding for key terms.>",
  "next_steps": "<A numbered list of actionable next steps for the support agent to resolve the ticket. If the ticket is already resolved, state that no further action is needed.>",
  "preventative_measures": "<A bulleted list of suggestions for product improvements, documentation updates, or process changes that could prevent similar tickets in the future.>"
}

RULES:
1.  Provide your response in clear, concise language using rich Markdown formatting (bold, italics, lists).
2.  Use Markdown for numbered and bulleted lists within the JSON string values (e.g., "1. Step 1\\n2. Step 2" or "- Suggestion 1\\n- Suggestion 2").
3.  The output must be ONLY the JSON object, with no surrounding text or explanations.`;

    const userPrompt = `Please perform a detailed analysis of the following support ticket JSON data.

TICKET DATA:
---
${JSON.stringify(ticketInfo.analysisPayload, null, 2)}
---`;

    const payload = {
        "contents": [{ "parts": [{ "text": userPrompt }] }],
        "systemInstruction": { "parts": [{ "text": systemPrompt }] },
        "generationConfig": { "responseMimeType": "application/json" }
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error((errorData.error && errorData.error.message) || `Gemini API Error: ${response.status}`);
    }

    const result = await response.json();
    const candidate = result.candidates && result.candidates[0];
    const usage = result.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };
    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0].text) {
        throw new Error("Invalid response structure from Gemini API for extended analysis.");
    }

    return {
        result: sanitizeAndParseJson(candidate.content.parts[0].text),
        usage: {
            input: usage.promptTokenCount,
            output: usage.candidatesTokenCount
        }
    };
}


/**
 * Uploads the large JSON data file to the Gemini File API.
 */
async function uploadFileToGemini(geminiKey, filename, jsonData) {
    // ... function content remains the same
    console.log(`Uploading ${filename} to File API...`);
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiKey}`;

    const fileBlob = new Blob([jsonData], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', fileBlob, filename);

    const response = await fetch(uploadUrl, { method: 'POST', body: formData });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("File API upload failed:", errorData);
        throw new Error((errorData.error && errorData.error.message) || `File API Error: ${response.status}`);
    }
    const result = await response.json();
    if (!result || !result.file || !result.file.uri) {
        throw new Error("Invalid response from File API during upload.");
    }
    console.log("File uploaded successfully:", result.file.uri);
    return result.file.uri;
}

/**
 * Sends all ticket data to Gemini for overall analysis using the File API.
 */
async function analyzeOverallWithGemini(geminiKey, selectedModel) {
    // ... function content remains the same
    const rateLimitDelay = parseInt(rateLimitDelayInput.value, 10) * 1000 || 60000;
    const maxAttempts = parseInt(maxRetriesInput.value, 10) || 3;
    let attempts = 0;
    let currentDelay = rateLimitDelay;

    const filename = fileUploadInput.files[0] ? fileUploadInput.files[0].name.replace(/(\.xlsx|\.xls|\.csv)$/, '.json') : 'uploaded_data.json';
    let fileUri;
    try {
        const jsonData = JSON.stringify(allFetchedData, null, 2);
        fileUri = await uploadFileToGemini(geminiKey, filename, jsonData);
    } catch (uploadError) {
        console.error("Fatal error during file upload, aborting analysis.", uploadError);
        throw uploadError;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`;
    const sanitizedDomain = fsDomainInput.value.trim().replace(/^https?:\/\//, '');
    const { systemPrompt, userPrompt } = getOverallPrompts();
    let finalUserPrompt = userPrompt.replace("'[FILENAME_HERE].json'", `'${filename}'`);
    finalUserPrompt = finalUserPrompt.replace(/\[FS_DOMAIN_HERE\]/g, sanitizedDomain);


    const payload = {
        "contents": [{
            "parts": [{
                "text": finalUserPrompt
            }, {
                "fileData": {
                    "mimeType": "text/plain",
                    "fileUri": fileUri
                }
            }]
        }],
        "systemInstruction": {
            "parts": [{
                "text": systemPrompt
            }]
        }
    };

    while (attempts < maxAttempts) {
        if (isCancelled) throw new Error("Operation cancelled by user.");
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn(`Gemini rate limit hit for overall analysis. Retrying in ${currentDelay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, currentDelay));
                    currentDelay *= 2;
                    attempts++;
                    continue;
                }
                const errorData = await response.json();
                throw new Error((errorData.error && errorData.error.message) || `Gemini API Error: ${response.status}`);
            }

            const result = await response.json();
            const candidate = result.candidates && result.candidates[0];
            const usage = result.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };

            if (!result.candidates || result.candidates.length === 0) {
                console.error("Gemini API returned no candidates. Full response:", JSON.stringify(result, null, 2));
                let errorMessage = "Gemini API returned no candidates.";
                if (result.promptFeedback && result.promptFeedback.blockReason) {
                    errorMessage += ` Reason: ${result.promptFeedback.blockReason}. The prompt may have been blocked for safety reasons.`;
                }
                throw new Error(errorMessage);
            }


            if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
                console.error("Invalid content structure in Gemini response candidate:", JSON.stringify(candidate, null, 2));
                throw new Error("Invalid response structure from Gemini API for overall analysis (missing content parts).");
            }

            const fullResponseText = candidate.content.parts.map(part => part.text).join("");
            return {
                result: fullResponseText,
                usage: {
                    input: usage.promptTokenCount,
                    output: usage.candidatesTokenCount
                }
            };
        } catch (error) {
            if (error.message && error.message.toLowerCase().includes('exceeds the maximum number of tokens')) {
                throw error; // Re-throw immediately to stop retries for token limit errors
            }
            console.error(`Overall Gemini analysis attempt ${attempts + 1} failed:`, error);
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error(`Overall Gemini analysis failed after ${maxAttempts} attempts: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, currentDelay));
        }
    }
}


/**
 * Fetches the list of available Gemini models from the API.
 */
async function populateGeminiModels() {
    // ... function content remains the same
    const geminiApiKey = geminiApiKeyInput.value.trim();
    if (!geminiApiKey) {
        geminiModelSelect.innerHTML = '<option value="">Enter API Key to load models</option>';
        geminiModelSelect.disabled = true;
        return;
    }

    geminiModelSelect.disabled = true;
    geminiModelSelect.innerHTML = '<option value="">Loading models...</option>';

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error((errorData.error && errorData.error.message) || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        availableGeminiModels = data.models.filter(model =>
            model.supportedGenerationMethods.includes('generateContent') &&
            !model.name.includes('embedding') &&
            !model.name.includes('aqa')
        );

        updateModelDropdown();

    } catch (error) {
        console.error('Failed to fetch Gemini models:', error);
        geminiModelSelect.innerHTML = `<option value="">Error: ${error.message}</option>`;
    } finally {
        geminiModelSelect.disabled = false;
    }
}

/**
 * Fetches available ticket fields from FreshService API.
 */
async function fetchTicketFields() {
    if (ticketFieldsCache.length > 0) {
        return ticketFieldsCache;
    }
    const domain = fsDomainInput.value.trim();
    const apiKey = fsApiKeyInput.value.trim();
    const credentials = btoa(`${apiKey}:X`);
    const headers = { "Authorization": `Basic ${credentials}` };
    const sanitizedDomain = domain.replace(/^https?:\/\//, '');
    const url = `https://${sanitizedDomain}/api/v2/ticket_form_fields`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`Failed to fetch ticket fields. Status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.ticket_fields) {
        throw new Error(`Could not find 'ticket_fields' property in the API response.`);
    }
    ticketFieldsCache = data.ticket_fields;
    return ticketFieldsCache;
}

/**
 * Fetches all departments (companies) from the FreshService API, handling pagination.
 */
async function fetchAllDepartments() {
    const domain = fsDomainInput.value.trim();
    const apiKey = fsApiKeyInput.value.trim();
    const credentials = btoa(`${apiKey}:X`);
    const headers = { "Authorization": `Basic ${credentials}` };
    const sanitizedDomain = domain.replace(/^https?:\/\//, '');

    let allDepartments = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `https://${sanitizedDomain}/api/v2/departments?page=${page}`;
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`Failed to fetch departments. Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.departments && data.departments.length > 0) {
            allDepartments = allDepartments.concat(data.departments);
            page++;
        } else {
            hasMore = false;
        }
    }
    return allDepartments;
}


// --- Prompt Management API Functions ---

/**
 * Counts the tokens in a given text using the Gemini API.
 * @param {string} text The text to count tokens for.
 * @param {string} geminiKey The Gemini API key.
 * @param {string} model The model to use for counting.
 * @returns {Promise<number>} The total number of tokens.
 */
async function countTokensWithGemini(text, geminiKey, model) {
    if (!text || !geminiKey || !model) return 0;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:countTokens?key=${geminiKey}`;
    const payload = { "contents": [{ "parts": [{ "text": text }] }] };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error((errorData.error && errorData.error.message) || `Token count API Error: ${response.status}`);
        }
        const result = await response.json();
        return result.totalTokens || 0;
    } catch (error) {
        console.error("Token counting failed:", error);
        return 0; // Return 0 on failure to avoid breaking UI
    }
}

/** Fetches the list of prompt filenames from the server. */
async function fetchPromptList() {
    const response = await fetch('/list-prompts');
    if (!response.ok) throw new Error('Failed to fetch prompt list.');
    return await response.json();
}

/** Fetches the content of a specific prompt file. */
async function fetchPromptContent(filename) {
    const response = await fetch(`/assets/prompts/${filename}`);
    if (!response.ok) throw new Error(`Failed to fetch prompt: ${filename}`);
    return await response.json();
}

/** Checks if a prompt filename already exists on the server. */
async function checkPromptExists(filename) {
    const response = await fetch(`/check-prompt-exists?filename=${encodeURIComponent(filename)}`);
    if (!response.ok) throw new Error('Failed to check prompt existence.');
    const data = await response.json();
    return data.exists;
}

/** Saves a prompt to the server. */
async function savePromptToServer(filename, content) {
    const response = await fetch('/save-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content })
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save prompt: ${errorText}`);
    }
    return await response.json();
}

/** Deletes a prompt from the server. */
async function deletePromptFromServer(filename) {
    const response = await fetch('/delete-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete prompt: ${errorText}`);
    }
    return await response.json();
}