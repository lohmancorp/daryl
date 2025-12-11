/**
 * File: main.js
 * Description: The main entry point of the application, containing core logic, process flows, and event listener initializations.
 * Author: D.A.R.Y.L. & Taylor Giddens
 */

// --- Main Application Logic & Event Listeners ---
// This file is the entry point and orchestrator for the application.
// It contains the core analysis logic and sets up all event listeners.

let menuCloseTimer; // Timer for menu closing delay


// --- Core Modal Functions (Moved to Top for Scope Fix) ---

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

/**
 * Opens the Prompts modal and prepares it for viewing.
 */
function openPromptsModal() {
    promptsModal.classList.remove('hidden');
    initializePrompts();
    const modalContent = promptsModal.querySelector('.modal-scroll-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    setDefaultSchemas(); // Initialize default schemas on load
    loadSettings();
    updateSettingsBadge();
    toggleRequiredIndicators();
    populateGeminiModels(); // Attempt to load models on page start
    initializePrompts(); // NEW: Initialize the prompt datalist
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
    // --- File/Extraction Listeners ---
    fileUploadInput.addEventListener('change', handleFileUpload);
    dropZoneContainer.addEventListener('click', () => fileUploadInput.click()); // Click initiates file dialog
    dropZoneContainer.addEventListener('dragover', handleFileDragOver);
    dropZoneContainer.addEventListener('dragleave', handleFileDragLeave);
    dropZoneContainer.addEventListener('drop', handleFileDrop); // Added logic to handle the drop in ui.js

    columnSelect.addEventListener('change', updateTicketCount);
    extractionProfileSelect.addEventListener('change', handleExtractionProfileChange); // NEW: Handle profile change

    // --- Control Listeners ---
    startButton.addEventListener('click', startAnalysis);
    pauseButton.addEventListener('click', handlePauseResume);
    cancelButton.addEventListener('click', handleCancel);
    newAnalysisButton.addEventListener('click', startNewAnalysis);
    openSettingsFromOverlayBtn.addEventListener('click', openSettingsModal);
    perTicketRadio.addEventListener('change', handleJobTypeChange);
    overallRadio.addEventListener('change', handleJobTypeChange);
    chunkedRadio.addEventListener('change', handleJobTypeChange); // NEW


    // Menu Listeners
    menuContainer.addEventListener('mouseenter', () => {
        clearTimeout(menuCloseTimer); // Cancel any pending close command
        menuDropdown.classList.remove('hidden');
    });
    menuContainer.addEventListener('mouseleave', () => {
        // Set a timer to close the menu, allowing the user to move to the dropdown
        menuCloseTimer = setTimeout(() => {
            if (!menuContainer.classList.contains('menu-open')) {
                menuDropdown.classList.add('hidden');
            }
        }, 200); // 200ms delay
    });
    menuButton.addEventListener('click', (e) => {
        e.preventDefault(); // FIX: Prevent default behavior which was interfering with the menu state
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

    // NEW: Main Prompt Selector Listeners
    promptSelectInput.addEventListener('input', handlePromptSelection);
    togglePromptDatalistBtn.addEventListener('click', () => {
        // Programmatically trigger the datalist dropdown by setting focus
        promptSelectInput.focus();
    });
    clearPromptSelectionBtn.addEventListener('click', handleClearPromptSelection);

    // NEW: Prompt 2 Selector Listeners (Chunked Mode)
    prompt2SelectInput.addEventListener('input', handlePrompt2Selection);
    togglePrompt2DatalistBtn.addEventListener('click', () => {
        prompt2SelectInput.focus();
    });
    clearPrompt2SelectionBtn.addEventListener('click', handleClearPrompt2Selection);


    // Prompts Editor Modal Listeners
    closePromptEditorBtn.addEventListener('click', () => promptEditorModal.classList.add('hidden'));
    promptDescriptionInput.addEventListener('input', handleDescriptionInput);
    promptContentInput.addEventListener('blur', handlePromptContentBlur);
    promptNameInput.addEventListener('blur', handlePromptNameBlur);
    savePromptBtn.addEventListener('click', handleSavePrompt);
    generatePromptBtn.addEventListener('click', handleGeneratePrompt);

    // Generate Prompt Confirmation Modal Listeners
    cancelGenerateBtn.addEventListener('click', () => generatePromptConfirmModal.classList.add('hidden'));
    generateNewBtn.addEventListener('click', handleGenerateNewPrompt);
    updateExistingBtn.addEventListener('click', handleUpdateExistingPrompt);


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
    [fsDomainInput, fsApiKeyInput, geminiApiKeyInput, productModulesInput, useCasesInput, apiDelayInput, rateLimitDelayInput, maxRetriesInput, atrInput, geminiModelSelect, extractionProfileSelect, promptSelectInput, prompt2SelectInput].forEach(input => {
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
}); // <--- FIX: Added missing closing brace here

// --- Core Application Logic Functions ---

/**
 * Toggles UI elements when the extraction profile changes.
 */
function handleExtractionProfileChange() {
    const profile = extractionProfileSelect.value;
    const isUploadExtract = profile === 'upload-extract';

    // Toggle visibility of the ticket ID column selector
    columnSelectContainer.classList.toggle('hidden', isUploadExtract);

    // Toggle required indicators in settings modal
    toggleRequiredIndicators();

    // Clear any previous file data if switching from upload-extract
    if (!isUploadExtract) {
        fileUploadInput.value = '';
        fileNameDisplay.textContent = '';
        sheetData = [];
    }

    // Re-run updateTicketCount to refresh UI based on current file/profile state
    updateTicketCount();
    saveSettings();
}

/**
 * Toggles UI elements when the job type changes.
 */
function handleJobTypeChange() {
    updateModelDropdown();
    // Re-run updateTicketCount to check prompts logic for chunked analysis
    updateTicketCount();
    saveSettings(); // Ensure jobType is saved for next load
}

/**
 * Fetches and caches the company/department list from FreshService.
 */
async function fetchAndCacheDepartments() {
    const extractionProfile = extractionProfileSelect.value;
    // Skip fetching if using an uploaded extract, as company data should be in the file
    if (extractionProfile === 'upload-extract') {
        companyDataCache = {}; // Clear cache to prevent stale data usage
        console.log("Skipping FreshService company fetch due to 'Upload Extract' profile.");
        return;
    }

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
    const isUploadExtract = extractionProfile === 'upload-extract';
    const apiDelay = parseInt(apiDelayInput.value, 10) || 200;
    const modules = productModulesInput.value.trim();
    const useCases = useCasesInput.value.trim();
    const selectedColumn = columnSelect.value;
    const jobType = document.querySelector('input[name="jobType"]:checked').value;

    // --- Validation ---
    if (!isUploadExtract) {
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
    if (sheetData.length === 0) {
        const fileType = isUploadExtract ? "JSON Extract" : "Ticket ID file";
        displayError(`Please upload a valid ${fileType}.`);
        hideProcessingAnimation();
        return;
    }
    if (!isUploadExtract && !selectedColumn) {
        displayError('Please select the ticket ID column from your uploaded file.');
        hideProcessingAnimation();
        return;
    }
    if ((jobType === 'overall' || jobType === 'chunked') && !currentPrompt) {
        displayError('Please select a prompt for Analysis from the dropdown.');
        hideProcessingAnimation();
        return;
    }
    // Validation for Chunked Analysis Prompt 2
    if (jobType === 'chunked' && !prompt2Section.classList.contains('hidden') && !currentPrompt2) {
        displayError('Please select a second prompt for the Synthesis phase.');
        hideProcessingAnimation();
        return;
    }

    // --- Initialization ---
    isPaused = false;
    isCancelled = false;
    displayError('', false);
    allFetchedData = [];
    allAnalysisResults = [];
    fetchedCount = 0;
    analyzedCount = 0;
    totalInputTokens = 0;
    totalOutputTokens = 0;
    extendedAnalysisCache = {}; // Reset cache for new run

    inProgressControls.classList.remove('hidden');
    startButton.classList.add('hidden');
    pauseButton.classList.remove('hidden');
    cancelButton.classList.remove('hidden');
    newAnalysisContainer.classList.add('hidden');
    pauseButton.disabled = false;
    cancelButton.disabled = false;
    pauseButton.textContent = 'Pause';

    if (tokenCountWarning) tokenCountWarning.classList.add('hidden'); // Defensive check

    resultsSection.classList.add('hidden');
    statsSection.classList.add('hidden');
    promptContainer.classList.add('hidden');
    promptContainer.innerHTML = '';
    resultsContainer.innerHTML = '';
    downloadContainer.classList.add('hidden');
    perTicketControlsContainer.classList.add('hidden');
    fetchProgressContainer.classList.add('hidden'); // Start hidden, only show if fetching

    analysisStartTime = Date.now();

    // --- Data Acquisition Phase ---
    let ticketIds = [];
    let fetchPhaseNeeded = false;
    let fileUri = null; // Store file URI for Gemini

    if (isUploadExtract) {
        // Case A: Upload Extract - Data is already in `sheetData` (the parsed JSON)
        allFetchedData = sheetData;
        ticketIds = allFetchedData.map(t => t.ticket ? (t.ticket.id || 'N/A') : 'N/A').filter(id => id && id !== 'N/A');
        fetchedCount = ticketIds.length;
        console.log(`Skipping FreshService fetch. Loaded ${fetchedCount} tickets from uploaded JSON extract.`);

        // Pre-fill companyDataCache from uploaded data (if available) for display purposes
        companyDataCache = allFetchedData.reduce((acc, data) => {
            if (data.department_id && data.company_name) {
                acc[data.department_id] = data.company_name;
            }
            return acc;
        }, {});

    } else {
        // Case B: Light/Extended Profile - Must fetch from FreshService
        fetchPhaseNeeded = true;
        await fetchAndCacheDepartments(); // Fetch external company data

        // Use the getDeepValue helper when extracting from a CSV/XLSX or flat JSON array
        ticketIds = sheetData.map(row => {
            const value = getDeepValue(row, selectedColumn) || '';
            return String(value).replace(/\D/g, '');
        }).filter(id => id && id.trim() !== '');

        fetchProgressContainer.classList.remove('hidden');
        updateProgressBar('fetch', 0, ticketIds.length);

        // Start Fetching Loop
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
    }

    // Check for cancellation after data acquisition
    if (isCancelled) {
        resetControls('Analysis Cancelled');
        return;
    }

    // Check if any valid data was acquired
    if (allFetchedData.length === 0 || allFetchedData.every(t => t.error)) {
        displayError('No valid ticket data was acquired to proceed with analysis.', true);
        resetControls();
        return;
    }


    // --- Analysis Phase ---
    console.log(`Starting ${jobType} Analysis with Gemini...`);

    analysisProgressContainer.classList.remove('hidden');

    // Set up timer interval
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const totalAnalysisUnits = jobType === 'perTicket' ? allFetchedData.length : 1;
        // In chunked mode, we update manually within the loop
        if (jobType !== 'chunked') {
            updateProgressBar('analysis', analyzedCount, totalAnalysisUnits);
        }
        if (fetchPhaseNeeded) {
            updateProgressBar('fetch', fetchedCount, ticketIds.length);
        }
    }, 1000);


    if (jobType === 'perTicket') {
        await runPerTicketAnalysis(geminiApiKey, selectedModel, modules, useCases, fsDomain);
    } else if (jobType === 'chunked') {
        // New Chunked Analysis Mode
        await runChunkedAnalysis(geminiApiKey, selectedModel, currentPrompt, currentPrompt2, fsDomain);
    } else {
        // Overall Analysis
        // Perform upload once here for overall analysis
        if (!isDummyMode) {
            try {
                const filename = fileUploadInput.files[0] ? fileUploadInput.files[0].name.replace(/(\.xlsx|\.xls|\.csv|\.json)$/, '.json') : 'uploaded_data.json';
                const jsonData = JSON.stringify(allFetchedData, null, 2);
                fileUri = await uploadFileToGemini(geminiApiKey, filename, jsonData); // Store URI for later use
            } catch (uploadError) {
                console.error("Fatal error during file upload, aborting analysis.", uploadError);
                handleGeminiFailure(uploadError.message, 'overall');
                return;
            }
        }
        
        await runOverallAnalysis(geminiApiKey, selectedModel, currentPrompt, fsDomain, fileUri);
        // Clean up uploaded file after analysis
        if (fileUri) await deleteFileFromGemini(geminiApiKey, fileUri);
    }
}


/**
 * Runs the per-ticket analysis process.
 * ... (No changes here, kept existing logic)
 */
async function runPerTicketAnalysis(geminiApiKey, selectedModel, modules, useCases, fsDomain) {
    const isDummyMode = dummyModeCheckbox.checked;

    if (isDummyMode) {
        // Dummy mode for Per Ticket: just displays basic ticket info without AI results
        resultsSection.classList.remove('hidden');
        displayPromptForUser();

        allFetchedData.forEach(ticketInfo => {
            if (ticketInfo.error) {
                allAnalysisResults.push({ ticket_id: ticketInfo.ticketId || (ticketInfo.ticket ? ticketInfo.ticket.id : 'N/A'), error: ticketInfo.error });
            } else {
                // Mock result structure for display
                const mockResult = {
                    problem_summary: 'DUMMY: Problem summarized by Mock AI.',
                    product_module: 'DUMMY: Product Module',
                    use_case: 'DUMMY: Use Case'
                };

                const resultData = {
                    ...mockResult,
                    ticket_id: ticketInfo.ticket.id,
                    priority: ticketInfo.ticket.priority,
                    status: ticketInfo.ticket.status,
                    type: ticketInfo.ticket.type,
                    company_name: ticketInfo.company_name || companyDataCache[ticketInfo.department_id] || 'N/A',
                };
                allAnalysisResults.push(resultData);
            }
        });

        displayPerTicketDownloadsAndSearch();
        allAnalysisResults.forEach((result, index) => {
            const rawData = allFetchedData[index]; // Get corresponding raw data
            displayResult(result, rawData, fsDomain);
        });

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
            resultData = { ticket_id: ticketInfo.ticketId || (ticketInfo.ticket ? ticketInfo.ticket.id : 'N/A'), error: ticketInfo.error };
        } else {
            try {
                const { result, usage } = await analyzeTicketWithGemini(ticketInfo, geminiApiKey, selectedModel, modules, useCases);
                totalInputTokens += usage.input;
                totalOutputTokens += usage.output;

                resultData = {
                    ...result,
                    ticket_id: ticketInfo.ticket.id,
                    priority: ticketInfo.ticket.priority,
                    status: ticketInfo.ticket.status,
                    type: ticketInfo.ticket.type,
                    company_name: ticketInfo.company_name || companyDataCache[ticketInfo.department_id] || 'N/A',
                };

            } catch (error) {
                console.error(`Error analyzing ticket ${ticketInfo.ticket.id}:`, error);
                resultData = { ticket_id: ticketInfo.ticket.id, error: error.message };
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
            displayResult(result, rawData, fsDomain);
        });

        displayAnalysisStats();
        setTimeout(() => scrollToElement(resultsSection), 100);

        playNotificationSound('success');
        showOsNotification('Analysis Complete!', 'Your per-ticket analysis is ready.');
    }

    resetControls(isCancelled ? 'Analysis Cancelled' : undefined);
}

/**
 * Runs the chunked ticket analysis process.
 * Phase 1: Chunking and Batch Analysis.
 * Phase 2: Synthesis.
 */
async function runChunkedAnalysis(geminiApiKey, selectedModel, prompt1, prompt2, fsDomain) {
    const isDummyMode = dummyModeCheckbox.checked;
    const CHUNK_SIZE = 20;
    
    // Determine the base filename for intermediate files
    let baseFilename = fileUploadInput.files[0] ? fileUploadInput.files[0].name : 'dataset';
    baseFilename = baseFilename.substring(0, baseFilename.lastIndexOf('.')) || baseFilename;

    analysisProgressContainer.classList.remove('hidden');
    analysisProgressText.textContent = 'Starting Chunked Analysis...';
    
    // --- Chunking Data ---
    const chunks = [];
    for (let i = 0; i < allFetchedData.length; i += CHUNK_SIZE) {
        chunks.push(allFetchedData.slice(i, i + CHUNK_SIZE));
    }
    
    const chunkResults = []; // To store intermediate JSON results
    
    // --- Phase 1: Batch Processing ---
    for (let i = 0; i < chunks.length; i++) {
        if (isCancelled) break;
        while (isPaused) { await new Promise(resolve => setTimeout(resolve, 200)); if (isCancelled) break; }
        
        const chunkIndex = i + 1;
        const currentChunk = chunks[i];
        const chunkFilename = `${baseFilename}_${String(chunkIndex).padStart(2, '0')}.json`;
        
        analysisProgressText.textContent = `Processing Chunk ${chunkIndex} of ${chunks.length} (${currentChunk.length} records)...`;
        updateProgressBar('analysis', chunkIndex, chunks.length + 1); // +1 for final synthesis step

        if (isDummyMode) {
            // Mock output for chunk
            const dummyOutput = `DUMMY RESULT FOR CHUNK ${chunkIndex}\n\nProcessed ${currentChunk.length} tickets using prompt "${prompt1.name}".`;
            chunkResults.push({
                filename: chunkFilename,
                content: dummyOutput,
                tickets: currentChunk // Keep reference to raw data if needed
            });
            await new Promise(resolve => setTimeout(resolve, 500)); // Fake delay
        } else {
            try {
                // Prepare chunk data for upload
                const chunkDataStr = JSON.stringify(currentChunk, null, 2);
                const chunkFileUri = await uploadFileToGemini(geminiApiKey, chunkFilename, chunkDataStr);
                
                // Analyze chunk with Prompt 1
                const { result, usage } = await analyzeOverallWithGemini(geminiApiKey, selectedModel, prompt1, fsDomain, chunkFileUri);
                totalInputTokens += usage.input;
                totalOutputTokens += usage.output;
                
                // Save result to memory (Dataset_XX.json)
                chunkResults.push({
                    filename: chunkFilename.replace('.json', '_result.json'), // distinct name for result
                    content: result,
                    rawChunkFilename: chunkFilename
                });
                
                // Cleanup chunk input file
                await deleteFileFromGemini(geminiApiKey, chunkFileUri);
                
            } catch (error) {
                console.error(`Error processing chunk ${chunkIndex}:`, error);
                handleGeminiFailure(`Chunk ${chunkIndex} failed: ${error.message}`, 'chunked');
                return;
            }
        }
    }

    if (isCancelled) {
        resetControls('Analysis Cancelled');
        return;
    }

    // --- Phase 2: Synthesis ---
    analysisProgressText.textContent = 'Synthesizing results (Phase 2)...';
    updateProgressBar('analysis', chunks.length + 1, chunks.length + 1);

    // If only 1 chunk and no Prompt 2 selected (<=20 records case), just show Prompt 1 result
    // If >1 chunk, Prompt 2 is required and used.
    let finalReport = '';
    let analysisSucceeded = false;

    if (chunks.length === 1 && !prompt2) {
        // Single chunk case, direct output
        finalReport = chunkResults[0].content;
        analysisSucceeded = true;
    } else {
        // Multi-chunk synthesis
        if (!prompt2 && !isDummyMode) {
             // Should be caught by validation, but safeguard here
             displayError("Synthesis Prompt (Prompt 2) is missing for multi-chunk analysis.", true);
             resetControls();
             return;
        }

        const synthesisInputFilename = `${baseFilename}_aggregated_results.json`;
        // Aggregate all chunk outputs into one JSON array
        const aggregatedData = chunkResults.map(c => ({
            chunk: c.filename,
            analysis: c.content
        }));
        
        if (isDummyMode) {
            finalReport = `## DUMMY SYNTHESIS REPORT\n\nAggregated ${chunks.length} chunks.\nUsed Prompt 2: "${prompt2 ? prompt2.name : 'N/A'}"\n\n---\n${prompt2 ? prompt2.prompt : 'No prompt text'}`;
            analysisSucceeded = true;
        } else {
            try {
                // Upload aggregated results
                const aggregatedJsonStr = JSON.stringify(aggregatedData, null, 2);
                const aggregatedFileUri = await uploadFileToGemini(geminiApiKey, synthesisInputFilename, aggregatedJsonStr);
                
                // Run Prompt 2
                const { result, usage } = await analyzeOverallWithGemini(geminiApiKey, selectedModel, prompt2, fsDomain, aggregatedFileUri);
                finalReport = result;
                totalInputTokens += usage.input;
                totalOutputTokens += usage.output;
                analysisSucceeded = true;
                
                // Cleanup
                await deleteFileFromGemini(geminiApiKey, aggregatedFileUri);

            } catch (error) {
                console.error("Synthesis phase failed:", error);
                handleGeminiFailure(`Synthesis failed: ${error.message}`, 'chunked');
                return;
            }
        }
    }

    analysisEndTime = Date.now();

    // --- Display Results ---
    if (!isCancelled) {
        const { markdownReport, csvs } = parseOverallReport(finalReport);

        resultsSection.classList.remove('hidden');
        loadingIndicator.classList.add('hidden');

        // Display Final Report
        displayOverallReport(markdownReport);
        
        // Custom Downloads for Chunked Mode
        displayChunkedDownloads(chunkResults, finalReport, analysisSucceeded);
        
        displayAnalysisStats();
        setTimeout(() => scrollToElement(resultsSection), 100);

        if (analysisSucceeded) {
            playNotificationSound('success');
            showOsNotification('Analysis Complete!', 'Your Chunked Ticket Analysis is ready.');
        }
    }
    
    resetControls(isCancelled ? 'Analysis Cancelled' : undefined);
}


/**
 * Runs the overall analysis process.
 * (Kept existing function)
 */
async function runOverallAnalysis(geminiApiKey, selectedModel, promptData, fsDomain, fileUri) {
    const isDummyMode = dummyModeCheckbox.checked;

    if (isDummyMode) {
        resultsSection.classList.remove('hidden');
        displayPromptForUser(false, true);
        // In dummy mode, show the prompt as the report content
        const dummyReport = `## DUMMY REPORT (Dummy Mode Enabled)\n\nThis is a mock report generated because Dummy Mode is checked. The following text is the user prompt content, which would normally be analyzed by Gemini:\n\n---\n${promptData.prompt}`;
        displayOverallReport(dummyReport);
        displayCsvDownloads([], dummyReport, true);
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

    // Data Preparation: File is already uploaded, fileUri is provided.
    const filename = fileUploadInput.files[0] ? fileUploadInput.files[0].name.replace(/(\.xlsx|\.xls|\.csv|\.json)$/, '.json') : 'uploaded_data.json';

    // Proactive token check before analysis
    try {
        const modelInfo = availableGeminiModels.find(m => m.name.split('/')[1] === selectedModel);
        if (modelInfo && modelInfo.inputTokenLimit) {
            // FIX: Pass the fileUri here to avoid redundant upload in countOverallTokensWithGemini
            const tokenCount = await countOverallTokensWithGemini(geminiApiKey, selectedModel, promptData, filename, fileUri);
            if (tokenCount > modelInfo.inputTokenLimit) {
                displayTokenCountWarning(tokenCount, modelInfo.inputTokenLimit, filename);
                resetControls();
                return;
            }
        }
    } catch (tokenError) {
        console.error("Failed to perform proactive token count:", tokenError);
        displayError(`Warning: Could not perform a pre-flight token count. Analysis will proceed but may fail if the payload is too large. Error: ${tokenError.message}`);
    }


    try {
        // FIX: analyzeOverallWithGemini now needs the fileUri and fsDomain
        const {
            result,
            usage
        } = await analyzeOverallWithGemini(geminiApiKey, selectedModel, promptData, fsDomain, fileUri);
        fullResponse = result;
        totalInputTokens += usage.input;
        totalOutputTokens += usage.output;
        updateProgressBar('analysis', 1, 1);
        analysisSucceeded = true;
    } catch (error) {
        console.error('Overall analysis failed:', error);
        analysisEndTime = Date.now();
        const errorMsg = error.message.toLowerCase();
        if ((errorMsg.includes('after') && errorMsg.includes('attempts')) || errorMsg.includes('exceeds the maximum number of tokens') || errorMsg.includes('file api error')) {
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
    const message = `Gemini analysis failed: ${errorMessage}. However, all ticket data has been successfully acquired. You can download the raw data and use the prompt provided to run the analysis manually.`;
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
    fileNameDisplay.textContent = ''; // Clear file name display
    columnSelect.innerHTML = '<option>Select column with Ticket IDs</option>';
    columnSelect.disabled = true;

    if (ticketCountDisplay) ticketCountDisplay.classList.add('hidden'); // Defensive check

    sheetData = [];

    // Reset prompt selection UI
    promptSelectInput.value = '';
    handleClearPromptSelection(false); 
    
    // Reset Prompt 2 UI
    prompt2SelectInput.value = '';
    handleClearPrompt2Selection();

    // Reset extraction profile and update UI to match
    extractionProfileSelect.value = 'light';
    handleExtractionProfileChange();

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
    if (tokenCountWarning) tokenCountWarning.classList.add('hidden'); // Defensive check

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