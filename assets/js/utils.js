/**
 * File: utils.js
 * Description: Contains helper and utility functions for various tasks like data formatting, privacy scrubbing, and API key sanitization.
 * Author: D.A.R.Y.L. & Taylor Giddens
 */

// --- Model Pricing (per 1,000,000 tokens) ---
const GEMINI_PRICING = {
    // Prices in USD per 1,000,000 tokens
    'gemini-1.5-flash-latest': { input: 0.35, output: 1.05 },
    'gemini-pro': { input: 0.50, output: 1.50 }, // Common model
    'gemini-1.5-pro-latest': { input: 3.50, output: 10.50 },
    // Add other models as they become available or needed
};


// --- Utility Functions ---
// This file contains general-purpose helper functions that do not fit
// into other categories like API, UI, or settings.


/**
 * Handles download click for the raw JSON data.
 */
function handleDownload() {
    const filename = prompt("Enter a filename for your download:", "freshservice_ticket_data.json");
    if (filename && allFetchedData.length > 0) {
        const dataStr = JSON.stringify(allFetchedData, null, 2);
        const blob = new Blob([dataStr], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

/**
 * Sanitizes an API key by checking for invalid characters.
 * @param {string} apiKey The API key to check.
 * @returns {boolean} True if the key is valid.
 */
function sanitizeApiKey(apiKey) {
    return !(!apiKey || /\s/.test(apiKey));
}

/**
 * Formats milliseconds into a human-readable time string (Hh Mm Ss).
 * @param {number} ms The number of milliseconds.
 * @returns {string} The formatted time string.
 */
function formatElapsedTime(ms) {
    if (ms < 0) ms = 0;
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds %= 60;
    minutes %= 60;

    const pad = (n) => n < 10 ? '0' + n : n;

    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

/**
 * Formats total minutes into a Days, Hours, Minutes string.
 * @param {number} totalMinutes The total minutes to format.
 * @returns {string} The formatted string (e.g., "1d 4h 30m").
 */
function formatTimeSaved(totalMinutes) {
    if (totalMinutes <= 0) return "0m";

    const minutesInDay = 24 * 60;
    const minutesInHour = 60;

    const days = Math.floor(totalMinutes / minutesInDay);
    let remainingMinutes = totalMinutes % minutesInDay;
    const hours = Math.floor(remainingMinutes / minutesInHour);
    const minutes = Math.round(remainingMinutes % minutesInHour);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || (days === 0 && hours === 0)) result += `${minutes}m`;

    return result.trim();
}

/**
 * Calculates the estimated cost of Gemini API usage.
 * @param {string} model The model used for the analysis.
 * @param {number} inputTokens Total input tokens used.
 * @param {number} outputTokens Total output tokens used.
 * @returns {string} A formatted USD currency string.
 */
function calculateGeminiCost(model, inputTokens, outputTokens) {
    const modelKey = Object.keys(GEMINI_PRICING).find(key => model.includes(key.replace('-latest', ''))) || 'gemini-1.5-flash-latest';
    const modelPricing = GEMINI_PRICING[modelKey];

    if (!modelPricing) {
        console.warn(`No pricing info found for model containing "${model}". Using fallback.`);
        return "N/A";
    }

    const inputCost = (inputTokens / 1000000) * modelPricing.input;
    const outputCost = (outputTokens / 1000000) * modelPricing.output;
    const totalCost = inputCost + outputCost;

    return `$${totalCost.toFixed(4)}`;
}


/**
 * Recursively filters an object based on a schema object.
 * @param {*} source The source data (object, array, or primitive).
 * @param {*} schema The schema defining which keys to keep.
 * @returns {*} The filtered data.
 */
function filterObjectBySchema(source, schema) {
    if (typeof source !== 'object' || source === null || typeof schema !== 'object' || schema === null) {
        return source;
    }

    if (Array.isArray(source)) {
        // If the source is an array, apply the filter to each item.
        // The schema is expected to define the structure for objects within the array.
        return source.map(item => filterObjectBySchema(item, schema));
    }

    const result = {};
    for (const key in schema) {
        if (source.hasOwnProperty(key)) {
            if (typeof schema[key] === 'object' && schema[key] !== null && !Array.isArray(schema[key])) {
                // If the schema value is an object, recurse
                result[key] = filterObjectBySchema(source[key], schema[key]);
            } else if (schema[key] === true) {
                // If the schema value is true, copy the value from the source
                result[key] = source[key];
            }
        }
    }
    return result;
}


// --- Privacy Functions ---

/**
 * Processes ticket and conversation data based on privacy settings (PII scrubbing only).
 * @param {object} ticketJson The raw ticket object from the API.
 * @param {object} convJson The raw conversations object from the API.
 * @returns {{ticket: object, conversations: Array}} Processed data.
 */
function processPrivacy(ticketJson, convJson) {
    let processedTicket = JSON.parse(JSON.stringify(ticketJson.ticket));
    let processedConversations = JSON.parse(JSON.stringify(convJson.conversations));

    const piiSettings = JSON.parse(localStorage.getItem('piiSettings') || '{}');
    if (Object.values(piiSettings).some(val => val === true)) {
        processedTicket = scrubObject(processedTicket, piiSettings);
        processedConversations = processedConversations.map(convo => scrubObject(convo, piiSettings));
    }

    return {
        ticket: processedTicket,
        conversations: processedConversations
    };
}

/**
 * Recursively scrubs a data object for PII.
 * @param {object} dataObject The object to scrub.
 * @param {object} piiSettings The PII settings configuration.
 * @returns {object} The scrubbed object.
 */
function scrubObject(dataObject, piiSettings) {
    for (const key in dataObject) {
        if (typeof dataObject[key] === 'string') {
            dataObject[key] = scrubText(dataObject[key], piiSettings);
        } else if (typeof dataObject[key] === 'object' && dataObject[key] !== null) {
            dataObject[key] = scrubObject(dataObject[key], piiSettings);
        }
    }
    return dataObject;
}

/**
 * Scrubs a single string of text for various PII types.
 * @param {string} text The text to scrub.
 * @param {object} piiSettings The PII settings configuration.
 * @returns {string} The scrubbed text.
 */
function scrubText(text, piiSettings) {
    if (!text) return text;
    let scrubbedText = text;
    if (piiSettings.scrubEmails) {
        scrubbedText = scrubbedText.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, 'email@domain.com');
    }
    if (piiSettings.scrubIps) {
        scrubbedText = scrubbedText.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, 'XXX.XXX.XXX.XXX');
    }
    if (piiSettings.scrubPhones) {
        scrubbedText = scrubbedText.replace(/\b(?:\+?1[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b/g, '555-555-5555');
    }
    if (piiSettings.scrubNames) {
        scrubbedText = scrubbedText.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, 'Person Doe');
    }
    if (piiSettings.scrubCompanies) {
        scrubbedText = scrubbedText.replace(/\b[A-Z][A-Za-z\s]+(?:,?\s(?:Inc|LLC|Ltd|Corp|Co)\.?)\b/g, 'Acme Inc');
    }
    return scrubbedText;
}

/**
 * Plays a notification sound.
 * @param {string} type 'success' or 'error'
 */
function playNotificationSound(type) {
    const audioContext = new(window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);

    if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    } else { // error
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
        oscillator.frequency.exponentialRampToValueAtTime(120, audioContext.currentTime + 0.2);
    }

    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}


/**
 * Shows an OS-level notification.
 * @param {string} title The notification title.
 * @param {string} body The notification body text.
 */
function showOsNotification(title, body) {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return;
    }

    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'assets/images/daryl_circle_logo_2.png'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, {
                    body: body,
                    icon: 'assets/images/daryl_circle_logo_2.png'
                });
            }
        });
    }
}