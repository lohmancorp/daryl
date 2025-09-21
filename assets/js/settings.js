/**
 * File: settings.js
 * Description: Handles saving, loading, and managing user settings via the browser's localStorage.
 * Author: D.A.R.Y.L. & Taylor Giddens
 */


// --- Settings Functions ---
// This file contains functions for saving, loading, and managing application
// settings, typically using localStorage.

/**
 * Saves all configurable settings to localStorage.
 */
function saveSettings() {
    localStorage.setItem('fsDomain', fsDomainInput.value);
    localStorage.setItem('fsApiKey', fsApiKeyInput.value);
    localStorage.setItem('geminiApiKey', geminiApiKeyInput.value);
    localStorage.setItem('geminiModel', geminiModelSelect.value);
    localStorage.setItem('productModules', productModulesInput.value);
    localStorage.setItem('useCases', useCasesInput.value);
    localStorage.setItem('dummyMode', dummyModeCheckbox.checked);
    localStorage.setItem('apiDelay', apiDelayInput.value);
    // Store the delay in seconds, but the input shows it in seconds
    localStorage.setItem('rateLimitDelay', rateLimitDelayInput.value);
    localStorage.setItem('maxRetries', maxRetriesInput.value);
    localStorage.setItem('atr', atrInput.value);
    localStorage.setItem('extractionProfile', extractionProfileSelect.value);
    localStorage.setItem('lightExtractSchema', JSON.stringify(lightExtractSchema));
    localStorage.setItem('extendedExtractSchema', JSON.stringify(extendedExtractSchema));

    const piiSettings = {
        scrubEmails: scrubEmailsToggle.checked,
        scrubIps: scrubIpsToggle.checked,
        scrubPhones: scrubPhonesToggle.checked,
        scrubNames: scrubNamesToggle.checked,
        scrubCompanies: scrubCompaniesToggle.checked
    };
    localStorage.setItem('piiSettings', JSON.stringify(piiSettings));
}

/**
 * Loads all settings from localStorage and applies them to the UI.
 */
function loadSettings() {
    fsDomainInput.value = localStorage.getItem('fsDomain') || '';
    fsApiKeyInput.value = localStorage.getItem('fsApiKey') || '';
    geminiApiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
    productModulesInput.value = localStorage.getItem('productModules') || '';
    useCasesInput.value = localStorage.getItem('useCases') || '';
    dummyModeCheckbox.checked = localStorage.getItem('dummyMode') === 'true';
    apiDelayInput.value = localStorage.getItem('apiDelay') || '200';
    rateLimitDelayInput.value = localStorage.getItem('rateLimitDelay') || '60';
    maxRetriesInput.value = localStorage.getItem('maxRetries') || '5';
    atrInput.value = localStorage.getItem('atr') || '15';
    extractionProfileSelect.value = localStorage.getItem('extractionProfile') || 'light';

    const savedLightSchema = localStorage.getItem('lightExtractSchema');
    const savedExtendedSchema = localStorage.getItem('extendedExtractSchema');

    if (savedLightSchema && savedExtendedSchema) {
        try {
            lightExtractSchema = JSON.parse(savedLightSchema);
            extendedExtractSchema = JSON.parse(savedExtendedSchema);
        } catch (e) {
            console.error("Could not parse saved schemas, reverting to default.", e);
            setDefaultSchemas();
        }
    } else {
        // This is called from schemas.js on page load now.
        // setDefaultSchemas();
    }


    const piiSettings = JSON.parse(localStorage.getItem('piiSettings') || '{}');
    scrubEmailsToggle.checked = piiSettings.scrubEmails || false;
    scrubIpsToggle.checked = piiSettings.scrubIps || false;
    scrubPhonesToggle.checked = piiSettings.scrubPhones || false;
    scrubNamesToggle.checked = piiSettings.scrubNames || false;
    scrubCompaniesToggle.checked = piiSettings.scrubCompanies || false;
}

/**
 * Toggles the visibility of an API key input field.
 * @param {string} keyType Either 'fs' for FreshService or 'gemini'.
 */
function toggleApiKeyVisibility(keyType) {
    const input = (keyType === 'fs') ? fsApiKeyInput : geminiApiKeyInput;
    const showIcon = document.getElementById(`${keyType}ApiKeyShow`);
    const hideIcon = document.getElementById(`${keyType}ApiKeyHide`);

    if (input.type === 'password') {
        input.type = 'text';
        showIcon.classList.add('hidden');
        hideIcon.classList.remove('hidden');
    } else {
        input.type = 'password';
        showIcon.classList.remove('hidden');
        hideIcon.classList.add('hidden');
    }
}