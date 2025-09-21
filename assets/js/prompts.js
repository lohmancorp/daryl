/**
 * File: prompts.js
 * Description: Manages all UI and logic for the Prompts feature, including the library and editor.
 * Author: D.A.R.Y.L. & Taylor Giddens
 */

// --- Prompt Library Functions ---

/**
 * Initializes the prompts library by fetching and rendering all available prompts.
 */
async function initializePrompts() {
    try {
        const promptFiles = await fetchPromptList();
        const promptPromises = promptFiles.map(async(file) => {
            const content = await fetchPromptContent(file);
            return {...content, filename: file };
        });
        allPrompts = await Promise.all(promptPromises);
        renderPromptsTable(allPrompts);
        populatePromptDatalist(allPrompts); // NEW: Populate the datalist on initialization
    } catch (error) {
        console.error("Error initializing prompts:", error);
        promptsTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-red-500">${error.message}</td></tr>`;
    }
}

/**
 * Renders the list of prompts into the main prompts table.
 * @param {Array} prompts - The array of prompt objects to render.
 */
function renderPromptsTable(prompts) {
    promptsTableBody.innerHTML = '';
    if (prompts.length === 0) {
        noPromptsMessage.classList.remove('hidden');
        return;
    }
    noPromptsMessage.classList.add('hidden');

    prompts.forEach(prompt => {
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-slate-50';
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-900">${prompt.name}</td>
            <td class="px-6 py-4">${prompt.description}</td>
            <td class="px-6 py-4">${prompt.tokens || 'N/A'}</td>
            <td class="px-6 py-4">${prompt.cost || 'N/A'}</td>
            <td class="px-6 py-4 text-center">
                 <div class="flex items-center justify-center space-x-2">
                    <button class="p-1 text-slate-500 hover:text-indigo-600" data-filename="${prompt.filename}" data-action="copy" data-tooltip="Copy Prompt">
                        <i data-lucide="copy" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                    <button class="p-1 text-slate-500 hover:text-indigo-600" data-filename="${prompt.filename}" data-action="edit" data-tooltip="View/Edit Prompt">
                        <i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                    <button class="p-1 text-slate-500 hover:text-red-600" data-filename="${prompt.filename}" data-action="delete" data-tooltip="Delete Prompt">
                        <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            </td>
        `;
        promptsTableBody.appendChild(row);
    });

    lucide.createIcons(); // Re-render icons for new buttons
    // Add event listeners for the new buttons
    promptsTableBody.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', handlePromptActionEvent);
    });
}

/**
 * Handles click events on the action buttons (copy, edit, delete) in the prompts table.
 * @param {Event} event - The click event.
 */
function handlePromptActionEvent(event) {
    const button = event.currentTarget;
    const action = button.dataset.action;
    const filename = button.dataset.filename;
    const promptToActOn = allPrompts.find(p => p.filename === filename);

    if (!promptToActOn) return;

    if (action === 'edit') {
        openPromptEditor('edit', promptToActOn);
    } else if (action === 'copy') {
        openPromptEditor('copy', promptToActOn);
    } else if (action === 'delete') {
        openDeletePromptModal(promptToActOn);
    }
}

/**
 * Filters the prompts table based on user input in the search field.
 */
function handlePromptSearch() {
    const query = promptSearchInput.value.toLowerCase().trim();
    clearPromptSearchBtn.classList.toggle('hidden', !query);

    const filteredPrompts = allPrompts.filter(p => {
        return p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            (p.prompt && p.prompt.toLowerCase().includes(query)) ||
            (p.tokens && p.tokens.toString().includes(query)) ||
            (p.cost && p.cost.toLowerCase().includes(query));
    });

    renderPromptsTable(filteredPrompts);
}

/**
 * Populates the datalist for prompt selection in the main UI.
 * @param {Array} prompts - The array of prompt objects.
 */
function populatePromptDatalist(prompts) {
    promptSelectDatalist.innerHTML = '';
    prompts.forEach(prompt => {
        const option = document.createElement('option');
        option.value = prompt.name;
        promptSelectDatalist.appendChild(option);
    });
}


/**
 * Handles the selection of a prompt from the datalist and displays its description.
 */
function handlePromptSelection() {
    const selectedPromptName = promptSelectInput.value;
    const selectedPrompt = allPrompts.find(p => p.name === selectedPromptName);

    if (selectedPrompt) {
        currentPrompt = selectedPrompt;
        displaySelectedPromptDescription(selectedPrompt);
    } else {
        currentPrompt = null;
        promptDescriptionContainer.classList.add('hidden');
        promptDescriptionText.textContent = '';
    }
}


// --- Prompt Editor Functions ---

/**
 * Opens and configures the prompt editor modal for 'add', 'edit', or 'copy' modes.
 * @param {string} mode - The mode to open the editor in ('add', 'edit', 'copy').
 * @param {object} [promptData=null] - The prompt data to populate the form with (for 'edit' and 'copy').
 */
function openPromptEditor(mode, promptData = null) {
    promptEditorMode = mode;
    currentEditingPrompt = promptData ? {...promptData } : null;

    // Reset form fields
    promptNameInput.value = '';
    promptNameInput.disabled = false;
    promptDescriptionInput.value = '';
    analysisObjectiveInput.innerHTML = '';
    promptContentInput.value = '';
    promptNameValidation.innerHTML = '';
    promptNameInput.classList.remove('border-red-500', 'border-green-500');
    promptTokenCount.textContent = '0';
    promptCost.textContent = '$0.0000';
    savePromptBtn.disabled = true;

    // Reset resizable fields' height
    promptDescriptionInput.style.height = '';
    analysisObjectiveInput.style.height = '';
    promptContentInput.style.height = '';

    // Reset disabled/editable states
    promptDescriptionInput.disabled = false;
    analysisObjectiveInput.contentEditable = true;
    promptContentInput.disabled = false;


    // Configure for different modes
    if (mode === 'add') {
        promptEditorTitle.textContent = 'Create New Prompt';
    } else if (mode === 'edit') {
        promptEditorTitle.textContent = `Edit: ${promptData.name}`;
        promptNameInput.value = promptData.name;
        promptNameInput.disabled = true;
        promptDescriptionInput.value = promptData.description;
        analysisObjectiveInput.innerHTML = promptData.analysis_objective || '';
        promptContentInput.value = promptData.prompt;
        promptTokenCount.textContent = promptData.tokens || '0';
        promptCost.textContent = promptData.cost || '$0.0000';
        savePromptBtn.disabled = false;
    } else if (mode === 'copy') {
        promptEditorTitle.textContent = 'Copy Prompt';
        promptDescriptionInput.value = promptData.description;
        analysisObjectiveInput.innerHTML = promptData.analysis_objective || '';
        promptContentInput.value = promptData.prompt;
        promptTokenCount.textContent = promptData.tokens || '0';
        promptCost.textContent = promptData.cost || '$0.0000';
        // Disable other fields until a valid new name is entered
        promptDescriptionInput.disabled = true;
        analysisObjectiveInput.contentEditable = false;
        promptContentInput.disabled = true;
    }

    handleDescriptionInput();
    promptEditorModal.classList.remove('hidden');
    const modalContent = promptEditorModal.querySelector('.modal-scroll-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }

    // Set initial toolbar state
    setTimeout(updateWysiwygToolbarState, 0);
}


/**
 * Handles input in the description textarea to update the character counter.
 */
function handleDescriptionInput() {
    const count = promptDescriptionInput.value.length;
    promptCharCounter.textContent = `${count} / 250`;
    promptCharCounter.classList.toggle('text-red-500', count >= 250);
    savePromptBtn.disabled = !isPromptFormValid();
}

/**
 * Handles the blur event on the prompt name input to validate its uniqueness.
 */
async function handlePromptNameBlur() {
    const name = promptNameInput.value.trim();
    if (!name) return;

    if (promptEditorMode === 'edit') {
        savePromptBtn.disabled = !isPromptFormValid();
        return;
    }

    const filename = `${name.toLowerCase().replace(/\s+/g, '-')}.json`;
    promptNameValidation.innerHTML = `<i data-lucide="loader" class="w-4 h-4 text-slate-500 animate-spin"></i>`;
    lucide.createIcons();

    const exists = await checkPromptExists(filename);

    if (exists) {
        promptNameValidation.innerHTML = `<i data-lucide="x-circle" class="w-5 h-5 text-red-500"></i>`;
        promptNameInput.classList.add('border-red-500');
        promptNameInput.classList.remove('border-green-500');
    } else {
        promptNameValidation.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-green-500"></i>`;
        promptNameInput.classList.remove('border-red-500');
        promptNameInput.classList.add('border-green-500');
        if (promptEditorMode === 'copy') {
            promptDescriptionInput.disabled = false;
            analysisObjectiveInput.contentEditable = true;
            promptContentInput.disabled = false;
        }
    }
    savePromptBtn.disabled = !isPromptFormValid();
    lucide.createIcons();
}


/**
 * Handles the blur event on the main prompt content to calculate tokens and cost.
 */
async function handlePromptContentBlur() {
    const text = promptContentInput.value.trim();
    const geminiKey = geminiApiKeyInput.value.trim();
    const model = geminiModelSelect.value;

    if (!text || !geminiKey || !model) {
        promptTokenCount.textContent = '0';
        promptCost.textContent = '$0.0000';
        return;
    };

    promptTokenCount.textContent = '...';
    promptCost.textContent = '...';

    const tokens = await countTokensWithGemini(text, geminiKey, model);
    const cost = calculateGeminiCost(model, tokens, 0);

    promptTokenCount.textContent = tokens;
    promptCost.textContent = cost;
}

/**
 * Checks if all required fields in the prompt editor are filled and valid.
 * @returns {boolean} True if the form is valid and can be saved.
 */
function isPromptFormValid() {
    const name = promptNameInput.value.trim();
    const description = promptDescriptionInput.value.trim();
    const prompt = promptContentInput.value.trim();
    const isNameValid = !promptNameInput.classList.contains('border-red-500');

    return name && description && prompt && isNameValid;
}


/**
 * Handles the save button click in the prompt editor.
 */
async function handleSavePrompt() {
    if (!isPromptFormValid()) {
        alert("Please fill out all required fields and ensure the prompt name is unique.");
        return;
    }

    const name = promptNameInput.value.trim();
    const description = promptDescriptionInput.value.trim();
    const analysis_objective = analysisObjectiveInput.innerHTML;
    const prompt = promptContentInput.value.trim();
    const tokens = promptTokenCount.textContent;
    const cost = promptCost.textContent;

    const filename = (promptEditorMode === 'edit' && currentEditingPrompt) ?
        currentEditingPrompt.filename :
        `${name.toLowerCase().replace(/\s+/g, '-')}.json`;


    const content = {
        name,
        description,
        analysis_objective,
        prompt,
        tokens: parseInt(tokens, 10) || 0,
        cost
    };

    savePromptBtn.disabled = true;
    savePromptBtn.innerHTML = `<i data-lucide="loader" class="w-5 h-5 animate-spin mx-auto"></i>`;
    lucide.createIcons();

    try {
        await savePromptToServer(filename, content);
        promptEditorModal.classList.add('hidden');
        await initializePrompts();
    } catch (error) {
        console.error("Failed to save prompt:", error);
        alert(`Error saving prompt: ${error.message}`);
    } finally {
        savePromptBtn.disabled = false;
        savePromptBtn.textContent = 'Save & Close';
    }
}

/**
 * Updates the WYSIWYG toolbar buttons to reflect the current selection's state.
 */
function updateWysiwygToolbarState() {
    const buttons = wysiwygToolbar.querySelectorAll('button');
    buttons.forEach(button => {
        const command = button.dataset.command;
        if (document.queryCommandState(command)) {
            button.classList.add('bg-indigo-100');
        } else {
            button.classList.remove('bg-indigo-100');
        }
    });
}


/**
 * Handles clicks on the WYSIWYG toolbar buttons.
 */
wysiwygToolbar.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button) {
        const command = button.dataset.command;
        document.execCommand(command, false, null);
        analysisObjectiveInput.focus();
        updateWysiwygToolbarState(); // Update state immediately after action
    }
});


/**
 * Gatekeeper function for the 'Generate Prompt' button.
 * Checks for existing content and shows a confirmation modal if necessary.
 */
async function handleGeneratePrompt() {
    const objective = analysisObjectiveInput.innerHTML;
    const existingPrompt = promptContentInput.value;
    const geminiKey = geminiApiKeyInput.value.trim();
    const model = geminiModelSelect.value;

    if (!objective.trim()) {
        alert("Please provide an Analysis Objective before generating a prompt.");
        return;
    }
    if (!geminiKey || !model) {
        alert("Please ensure your Gemini API Key is set and a model is selected in Settings.");
        return;
    }

    if (existingPrompt.trim()) {
        generatePromptConfirmModal.classList.remove('hidden');
    } else {
        await executePromptGeneration();
    }
}

/**
 * Handles the "Generate New" option from the confirmation modal.
 */
async function handleGenerateNewPrompt() {
    generatePromptConfirmModal.classList.add('hidden');
    promptContentInput.value = ''; // Clear the existing prompt before generating
    await executePromptGeneration();
}

/**
 * Handles the "Update Existing" option from the confirmation modal.
 */
async function handleUpdateExistingPrompt() {
    generatePromptConfirmModal.classList.add('hidden');
    await executePromptGeneration(); // Proceed with the existing prompt content
}


/**
 * Executes the actual prompt generation API call.
 */
async function executePromptGeneration() {
    const objective = analysisObjectiveInput.innerHTML;
    const existingPrompt = promptContentInput.value;
    const geminiKey = geminiApiKeyInput.value.trim();
    const model = geminiModelSelect.value;

    promptGenerationSpinner.classList.remove('hidden');
    generatePromptBtn.disabled = true;

    try {
        const newPrompt = await generatePromptWithGemini(objective, existingPrompt, geminiKey, model);
        promptContentInput.value = newPrompt;
        await handlePromptContentBlur();
    } catch (error) {
        alert(`Failed to generate prompt: ${error.message}`);
    } finally {
        promptGenerationSpinner.classList.add('hidden');
        generatePromptBtn.disabled = false;
    }
}


// Add input listeners to all required fields to re-validate the form
promptNameInput.addEventListener('input', () => {
    promptNameInput.classList.remove('border-red-500'); // Optimistically remove red border
    promptNameValidation.innerHTML = ''; // Clear validation icon until blur
    savePromptBtn.disabled = !isPromptFormValid();
});
promptContentInput.addEventListener('input', () => {
    savePromptBtn.disabled = !isPromptFormValid();
});
analysisObjectiveInput.addEventListener('input', () => {
    savePromptBtn.disabled = !isPromptFormValid();
});

// Listen for cursor changes in the WYSIWYG editor to update toolbar state
analysisObjectiveInput.addEventListener('keyup', updateWysiwygToolbarState);
analysisObjectiveInput.addEventListener('mouseup', updateWysiwygToolbarState);


// --- Delete Prompt Functions ---

/**
 * Opens the delete confirmation modal.
 * @param {object} prompt - The prompt object to be deleted.
 */
function openDeletePromptModal(prompt) {
    if (allPrompts.length <= 1) {
        alert("You cannot delete the last prompt.");
        return;
    }
    promptToDelete = prompt;
    deletePromptFilename.textContent = prompt.filename;
    deleteConfirmationInput.value = '';
    confirmDeleteBtn.disabled = true;
    deletePromptModal.classList.remove('hidden');
}

/**
 * Handles input in the delete confirmation field to enable/disable the delete button.
 */
function handleDeleteConfirmationInput() {
    const expected = deletePromptFilename.textContent;
    const actual = deleteConfirmationInput.value;
    confirmDeleteBtn.disabled = (expected !== actual);
}

/**
 * Executes the deletion of the prompt after confirmation.
 */
async function confirmPromptDeletion() {
    if (!promptToDelete) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = `<i data-lucide="loader" class="w-5 h-5 animate-spin mx-auto"></i>`;
    lucide.createIcons();

    try {
        await deletePromptFromServer(promptToDelete.filename);
        deletePromptModal.classList.add('hidden');
        await initializePrompts(); // Refresh the list
    } catch (error) {
        console.error("Failed to delete prompt:", error);
        alert(`Error deleting prompt: ${error.message}`);
    } finally {
        confirmDeleteBtn.innerHTML = 'Delete';
        promptToDelete = null;
    }
}