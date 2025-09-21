/**
 * File: main.js
 * Description: The main entry point of the application, containing core logic, process flows, and event listener initializations.
 * Author: D.A.R.Y.L. & Taylor Giddens
 */

// --- Main Application Logic & Event Listeners ---
// This file is the entry point and orchestrator for the application.
// It contains the core analysis logic and sets up all event listeners.


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    setDefaultSchemas(); // Initialize default schemas on load
    loadSettings();
    updateSettingsBadge();
    toggleRequiredIndicators();
    populateGeminiModels(); // Attempt to load models on page start
    lucide.createIcons(); // Initialize any new icons
    document.body.addEventListener('click', (e) => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
        // Close menu if clicking outside of the container
        if (menuContainer.classList.contains('menu-open') && !menuContainer.contains(e.target)) {
            menuContainer.classList.remove('menu-open');
            menuDropdown.classList.add('hidden');
        }
    });
});
fileUploadInput.addEventListener('change', handleFileUpload);
columnSelect.addEventListener('change', updateTicketCount);
startButton.addEventListener('click', startAnalysis);
pauseButton.addEventListener('click', handlePauseResume);
cancelButton.addEventListener('click', handleCancel);
newAnalysisButton.addEventListener('click', startNewAnalysis);
openSettingsFromOverlayBtn.addEventListener('click', openSettingsModal);
perTicketRadio.addEventListener('change', handleJobTypeChange);
overallRadio.addEventListener('change', handleJobTypeChange);


// Menu Listeners
menuContainer.addEventListener('mouseenter', () => {
    menuDropdown.classList.remove('hidden');
});
menuContainer.addEventListener('mouseleave', () => {
    // Only hide if the menu is not pinned open by a click
    if (!menuContainer.classList.contains('menu-open')) {
        menuDropdown.classList.add('hidden');
    }
});
menuButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent the body click listener from firing immediately
    const isOpen = menuContainer.classList.toggle('menu-open');
    if (isOpen) {
        menuDropdown.classList.remove('hidden');
    } else {
        menuDropdown.classList.add('hidden');
    }
});
openSettingsMenuItem.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent body click listener from closing the menu before modal opens
    openSettingsModal();
    menuContainer.classList.remove('menu-open');
    menuDropdown.classList.add('hidden');
});
openPromptsMenuItem.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent body click listener
    openPromptsModal();
    menuContainer.classList.remove('menu-open');
    menuDropdown.classList.add('hidden');
});


// Settings Modal Listeners
closeSettingsButton.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    updateSettingsBadge(); // Update badge and config section state on close
});
saveSettingsButton.addEventListener('click', () => {
    saveSettings();
    settingsModal.classList.add('hidden');
    updateSettingsBadge(); // Also update when explicitly saving
});
refreshGeminiModelsBtn.addEventListener('click', populateGeminiModels);
configureExtractionBtn.addEventListener('click', openExtractionSettingsModal);

// Prompts Modal Listeners (Main List View)
closePromptsModalBtn.addEventListener('click', () => promptsModal.classList.add('hidden'));
addPromptBtn.addEventListener('click', () => openPromptEditor('add'));
promptSearchInput.addEventListener('input', handlePromptSearch);
clearPromptSearchBtn.addEventListener('click', () => {
    promptSearchInput.value = '';
    handlePromptSearch();
});


// Prompts Editor Modal Listeners
closePromptEditorBtn.addEventListener('click', () => promptEditorModal.classList.add('hidden'));
promptDescriptionInput.addEventListener('input', handleDescriptionInput);
promptContentInput.addEventListener('blur', handlePromptContentBlur);
promptNameInput.addEventListener('blur', handlePromptNameBlur);
savePromptBtn.addEventListener('click', handleSavePrompt);

// Delete Prompt Modal Listeners
cancelDeleteBtn.addEventListener('click', () => deletePromptModal.classList.add('hidden'));
confirmDeleteBtn.addEventListener('click', confirmPromptDeletion);
deleteConfirmationInput.addEventListener('input', handleDeleteConfirmationInput);


// Extraction Settings Modal Listeners
closeExtractionSettingsBtn.addEventListener('click', () => extractionSettingsModal.classList.add('hidden'));
cancelExtractionSettingsBtn.addEventListener('click', () => {
    loadSettings();
    extractionSettingsModal.classList.add('hidden');
});
saveExtractionSettingsBtn.addEventListener('click', saveExtractionSettings);
resetExtractionBtn.addEventListener('click', resetActiveExtractionProfile);
extractionLightTabBtn.addEventListener('click', () => switchExtractionTab('light'));
extractionExtendedTabBtn.addEventListener('click', () => switchExtractionTab('extended'));
fieldSearchInput.addEventListener('keyup', handleFieldSearch);
clearSearchBtn.addEventListener('click', () => {
    fieldSearchInput.value = '';
    handleFieldSearch();
});


// Field Loader Modal Listeners
loadModulesBtn.addEventListener('click', () => openFieldLoader('productModules'));
loadUseCasesBtn.addEventListener('click', () => openFieldLoader('useCases'));
modalCancelBtn.addEventListener('click', closeFieldLoader);
modalUseBtn.addEventListener('click', useSelectedFieldOptions);
fieldSelect.addEventListener('change', updateFieldChoicesPreview);


// API Key & Settings Listeners for real-time badge update and persistence
[fsDomainInput, fsApiKeyInput, geminiApiKeyInput, productModulesInput, useCasesInput, apiDelayInput, rateLimitDelayInput, maxRetriesInput, atrInput, geminiModelSelect, extractionProfileSelect].forEach(input => {
    input.addEventListener('keyup', saveSettings);
    input.addEventListener('change', saveSettings);
});
geminiApiKeyInput.addEventListener('change', populateGeminiModels); // Refresh models on key change

dummyModeCheckbox.addEventListener('click', () => {
    saveSettings();
    updateSettingsBadge();
    toggleRequiredIndicators();
});
piiToggles.forEach(toggle => toggle.addEventListener('click', saveSettings));

// API key visibility toggles
document.getElementById('toggleFsApiKey').addEventListener('click', () => toggleApiKeyVisibility('fs'));
document.getElementById('toggleGeminiApiKey').addEventListener('click', () => toggleApiKeyVisibility('gemini'));

// Logo animation listeners
logoContainer.addEventListener('mouseenter', () => {
    if (logoVideo.paused) {
        logoImage.classList.add('hidden');
        logoVideo.classList.remove('hidden');
        logoVideo.play();
    }
});
logoContainer.addEventListener('mouseleave', () => {
    if (!isProcessing) {
        logoImage.classList.remove('hidden');
        logoVideo.classList.add('hidden');
        logoVideo.pause();
    }
});

// Extended Ticket Modal Listeners
closeExtendedTicketModalBtn.addEventListener('click', () => extendedTicketModal.classList.add('hidden'));
extendedTicketModal.addEventListener('click', (event) => {
    if (event.target === extendedTicketModal) {
        extendedTicketModal.classList.add('hidden');
    }
});
document.addEventListener('keydown', (event) => {
    if (event.key === "Escape" && !extendedTicketModal.classList.contains('hidden')) {
        extendedTicketModal.classList.add('hidden');
    }
});


// --- Modal Functions ---
/**
 * Opens the settings modal and prepares it for viewing.
 */
function openSettingsModal() {
    settingsModal.classList.remove('hidden');
    // Ensure the modal's content is scrolled to the top
    const modalContent = settingsModal.querySelector('.modal-scroll-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
    populateGeminiModels();
}


// --- Core Functions ---

/**
 * Toggles UI elements when the job type changes.
 */
function handleJobTypeChange() {
    updateModelDropdown();
}

/**
 * Fetches and caches the company/department list from FreshService.
 */
async function fetchAndCacheDepartments() {
    try {
        const storedCompanies = localStorage.getItem('companyDataCache');
        if (storedCompanies) {
            companyDataCache = JSON.parse(storedCompanies);
            console.log("Loaded companies from cache.");
            return;
        }
    } catch (e) {
        console.error("Could not parse cached company data, fetching fresh.", e);
        localStorage.removeItem('companyDataCache'); // Clear corrupted cache
    }

    try {
        console.log("Fetching company data from FreshService API...");
        const departments = await fetchAllDepartments();
        companyDataCache = departments.reduce((acc, dept) => {
            acc[dept.id] = dept.name;
            return acc;
        }, {});
        localStorage.setItem('companyDataCache', JSON.stringify(companyDataCache));
        console.log("Successfully fetched and cached company data.");
    } catch (error) {
        console.error("Failed to fetch company data:", error);
        displayError("Could not fetch company list from FreshService. Company names will not be available.", false);
        companyDataCache = {}; // Ensure it's an object to prevent errors
    }
}


/**
 * Main function to start the analysis process.
 */
async function startAnalysis() {
    showProcessingAnimation();

    const fsDomain = fsDomainInput.value.trim();
    const fsApiKey = fsApiKeyInput.value.trim();
    const geminiApiKey = geminiApiKeyInput.value.trim();
    const selectedModel = geminiModelSelect.value;
    const isDummyMode = dummyModeCheckbox.checked;
    const extractionProfile = extractionProfileSelect.value;
    const apiDelay = parseInt(apiDelayInput.value, 10) || 200;
    const modules = productModulesInput.value.trim();
    const useCases = useCasesInput.value.trim();
    const selectedColumn = columnSelect.value;
    const jobType = document.querySelector('input[name="jobType"]:checked').value;

    if (!fsDomain || !fsApiKey) {
        displayError('Please fill in FreshService Domain and API Key from the Settings menu.');
        hideProcessingAnimation();
        return;
    }
    if (!sanitizeApiKey(fsApiKey)) {
        displayError('The FreshService API Key appears to contain invalid characters (like spaces). Please check your key.');
        hideProcessingAnimation();
        return;
    }
    if (!isDummyMode && !geminiApiKey) {
        displayError('Please provide a Gemini API Key or enable Dummy Mode from the Settings menu.');
        hideProcessingAnimation();
        return;
    }
    if (!isDummyMode && !selectedModel) {
        displayError('Please select a Gemini Model from the Settings menu.');
        hideProcessingAnimation();
        return;
    }
    if (jobType === 'perTicket' && !isDummyMode && (!modules || !useCases)) {
        displayError('Please define Product Modules and Use Cases in the Settings menu for Per Ticket Analysis.');
        hideProcessingAnimation();
        return;
    }
    if (sheetData.length === 0 || !selectedColumn) {
        displayError('Please upload a file and select the ticket ID column.');
        hideProcessingAnimation();
        return;
    }


    isPaused = false;
    isCancelled = false;
    displayError('', false);
    allFetchedData = [];
    allAnalysisResults = [];
    fetchedCount = 0;
    analyzedCount = 0;
    totalInputTokens = 0;
    totalOutputTokens = 0;

    inProgressControls.classList.remove('hidden');
    startButton.classList.add('hidden');
    pauseButton.classList.remove('hidden');
    cancelButton.classList.remove('hidden');
    newAnalysisContainer.classList.add('hidden');
    pauseButton.disabled = false;
    cancelButton.disabled = false;
    pauseButton.textContent = 'Pause';

    resultsSection.classList.add('hidden');
    statsSection.classList.add('hidden');
    promptContainer.classList.add('hidden');
    promptContainer.innerHTML = '';
    resultsContainer.innerHTML = '';
    downloadContainer.classList.add('hidden');
    perTicketControlsContainer.classList.add('hidden');


    fetchProgressContainer.classList.remove('hidden');
    analysisProgressContainer.classList.add('hidden');
    analysisStartTime = Date.now();

    // Pre-fetch company data before starting the ticket loop
    await fetchAndCacheDepartments();

    const ticketIds = sheetData.map(row => String(row[selectedColumn]).replace(/\D/g, '')).filter(id => id && id.trim() !== '');
    updateProgressBar('fetch', 0, ticketIds.length);

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const inAnalysisPhase = !analysisProgressContainer.classList.contains('hidden');
        if (inAnalysisPhase) {
            const total = jobType === 'overall' ? 1 : allFetchedData.length;
            updateProgressBar('analysis', analyzedCount, total);
        } else {
            updateProgressBar('fetch', fetchedCount, ticketIds.length);
        }
    }, 1000);

    // Fetching Phase
    for (const ticketId of ticketIds) {
        if (isCancelled) break;
        while (isPaused) {
            await new Promise(resolve => setTimeout(resolve, 200));
            if (isCancelled) break;
        }
        if (isCancelled) break;

        const ticketInfo = await fetchFreshServiceData(ticketId, fsDomain, fsApiKey, extractionProfile);
        allFetchedData.push(ticketInfo);
        fetchedCount++;
        updateProgressBar('fetch', fetchedCount, ticketIds.length);
        if (!ticketInfo.error) {
            await new Promise(resolve => setTimeout(resolve, apiDelay));
        }
    }

    if (isCancelled) {
        resetControls('Analysis Cancelled');
        return;
    }

    if (jobType === 'perTicket') {
        await runPerTicketAnalysis(geminiApiKey, selectedModel, modules, useCases);
    } else {
        await runOverallAnalysis(geminiApiKey, selectedModel);
    }
}

/**
 * Runs the per-ticket analysis process.
 */
async function runPerTicketAnalysis(geminiApiKey, selectedModel, modules, useCases) {
    const isDummyMode = dummyModeCheckbox.checked;
    if (isDummyMode) {
        resultsSection.classList.remove('hidden');
        displayPromptForUser();
        analysisEndTime = Date.now();
        displayAnalysisStats();
        setTimeout(() => scrollToElement(resultsSection), 100);
        resetControls();
        return;
    }

    analysisProgressContainer.classList.remove('hidden');
    analyzedCount = 0;
    updateProgressBar('analysis', 0, allFetchedData.length);
    let hasFatalError = false;

    for (const ticketInfo of allFetchedData) {
        if (isCancelled) break;
        while (isPaused) { await new Promise(resolve => setTimeout(resolve, 200)); if (isCancelled) break; }
        if (isCancelled) break;

        let resultData = {};
        if (ticketInfo.error) {
            resultData = { ticket_id: ticketInfo.ticketId, error: ticketInfo.error };
        } else {
            try {
                const { result, usage } = await analyzeTicketWithGemini(ticketInfo, geminiApiKey, selectedModel, modules, useCases);
                totalInputTokens += usage.input;
                totalOutputTokens += usage.output;

                // Combine fetched data with analysis result
                resultData = {
                    ...result,
                    ticket_id: ticketInfo.ticketId,
                    priority: ticketInfo.ticket.priority,
                    status: ticketInfo.ticket.status,
                    type: ticketInfo.ticket.type,
                    company_name: companyDataCache[ticketInfo.department_id] || 'Unknown',
                };

            } catch (error) {
                console.error(`Error analyzing ticket ${ticketInfo.ticketId}:`, error);
                resultData = { ticket_id: ticketInfo.ticketId, error: error.message };
                const errorMsg = error.message.toLowerCase();
                if ((errorMsg.includes('after') && errorMsg.includes('attempts')) || errorMsg.includes('exceeds the maximum number of tokens')) {
                    hasFatalError = true;
                    analysisEndTime = Date.now();
                    handleGeminiFailure(error.message, 'perTicket');
                    break;
                }
            }
        }
        allAnalysisResults.push(resultData);
        analyzedCount++;
        updateProgressBar('analysis', analyzedCount, allFetchedData.length);
    }

    if (hasFatalError) return;
    analysisEndTime = Date.now();

    if (!isCancelled) {
        resultsSection.classList.remove('hidden');
        loadingIndicator.classList.add('hidden');

        displayPerTicketDownloadsAndSearch();

        allAnalysisResults.forEach((result, index) => {
            const rawData = allFetchedData[index]; // Get corresponding raw data
            displayResult(result, rawData);
        });

        displayAnalysisStats();
        setTimeout(() => scrollToElement(resultsSection), 100);

        // Play success notifications
        playNotificationSound('success');
        showOsNotification('Analysis Complete!', 'Your per-ticket analysis is ready.');
    }

    resetControls(isCancelled ? 'Analysis Cancelled' : undefined);
}

/**
 * Runs the overall analysis process.
 */
async function runOverallAnalysis(geminiApiKey, selectedModel) {
    const isDummyMode = dummyModeCheckbox.checked;
    if (isDummyMode) {
        resultsSection.classList.remove('hidden');
        const dummyReportText = displayPromptForUser(true, true);
        displayPromptForUser(false, true);
        displayCsvDownloads([], dummyReportText, false);
        analysisEndTime = Date.now();
        displayAnalysisStats();
        setTimeout(() => scrollToElement(resultsSection), 100);
        resetControls();
        return;
    }

    analysisProgressContainer.classList.remove('hidden');
    analysisProgressText.textContent = 'Performing overall analysis on all tickets...';
    updateProgressBar('analysis', 0, 1);

    let fullResponse = '';
    let analysisSucceeded = false;
    try {
        const {
            result,
            usage
        } = await analyzeOverallWithGemini(geminiApiKey, selectedModel);
        fullResponse = result;
        totalInputTokens += usage.input;
        totalOutputTokens += usage.output;
        updateProgressBar('analysis', 1, 1);
        analysisSucceeded = true;
    } catch (error) {
        console.error('Overall analysis failed:', error);
        analysisEndTime = Date.now();
        const errorMsg = error.message.toLowerCase();
        if ((errorMsg.includes('after') && errorMsg.includes('attempts')) || errorMsg.includes('exceeds the maximum number of tokens')) {
            handleGeminiFailure(error.message, 'overall');
            return;
        }
        fullResponse = `## Analysis Failed\n\nAn error occurred during the overall analysis:\n\n\`\`\`\n${error.message}\n\`\`\``;
        updateProgressBar('analysis', 1, 1);
    }

    analysisEndTime = Date.now();

    if (!isCancelled) {
        const {
            markdownReport,
            csvs
        } = parseOverallReport(fullResponse);

        resultsSection.classList.remove('hidden');
        loadingIndicator.classList.add('hidden');

        displayOverallReport(markdownReport);
        displayCsvDownloads(csvs, markdownReport, analysisSucceeded);
        displayAnalysisStats();
        setTimeout(() => scrollToElement(resultsSection), 100);

        if (analysisSucceeded) {
            playNotificationSound('success');
            showOsNotification('Analysis Complete!', 'Your D.A.R.Y.L. report is ready.');
        }
    }

    resetControls(isCancelled ? 'Analysis Cancelled' : undefined);
}


/**
 * Handles a fatal Gemini API failure by presenting the user with fallback options.
 */
function handleGeminiFailure(errorMessage, jobType) {
    const message = `Gemini analysis failed: ${errorMessage}. However, all ticket data has been successfully fetched. You can download the raw data and use the prompt provided to run the analysis manually.`;
    displayManualFallbackUI(message, jobType);
    hideProcessingAnimation();
    inProgressControls.classList.add('hidden');
    newAnalysisContainer.classList.remove('hidden');
    if (timerInterval) clearInterval(timerInterval);
}


/**
 * Handles the "Start New Analysis" button click.
 */
function startNewAnalysis() {
    displayError('', false);
    fileUploadInput.value = '';
    columnSelect.innerHTML = '<option>Select column with Ticket IDs</option>';
    columnSelect.disabled = true;
    ticketCountDisplay.classList.add('hidden');
    sheetData = [];

    fetchProgressContainer.classList.add('hidden');
    analysisProgressContainer.classList.add('hidden');
    fetchProgressBar.style.width = '0%';
    analysisProgressBar.style.width = '0%';
    fetchProgressText.textContent = 'Processed 0 of 0 tickets.';
    analysisProgressText.textContent = 'Processed 0 of 0 requests.';

    analysisSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    statsSection.classList.add('hidden');
    newAnalysisContainer.classList.add('hidden');

    startButton.classList.remove('hidden');
    inProgressControls.classList.add('hidden');

    scrollToElement(configSection);
}


// --- Pause/Cancel Functions ---

function handlePauseResume() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
}

function handleCancel() {
    isCancelled = true;
    isPaused = false;
    resetControls('Analysis Cancelled');
}

function resetControls(status) {
    if (timerInterval) clearInterval(timerInterval);
    hideProcessingAnimation();

    pauseButton.classList.add('hidden');
    cancelButton.classList.add('hidden');
    startButton.classList.add('hidden');
    inProgressControls.classList.add('hidden');


    if (status === 'Analysis Cancelled') {
        startNewAnalysis();
    } else {
        newAnalysisContainer.classList.remove('hidden');
        scrollToElement(newAnalysisContainer, 80);
    }

    isPaused = false;
}