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
            p.prompt.toLowerCase().includes(query) ||
            (p.tokens && p.tokens.toString().includes(query)) ||
            (p.cost && p.cost.toLowerCase().includes(query));
    });

    renderPromptsTable(filteredPrompts);
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
    promptContentInput.value = '';
    promptNameValidation.innerHTML = '';
    promptNameInput.classList.remove('border-red-500', 'border-green-500');
    promptTokenCount.textContent = '0';
    promptCost.textContent = '$0.0000';
    savePromptBtn.disabled = true;

    // Reset disabled state for copy mode
    promptDescriptionInput.disabled = false;
    promptContentInput.disabled = false;


    // Configure for different modes
    if (mode === 'add') {
        promptEditorTitle.textContent = 'Create New Prompt';
    } else if (mode === 'edit') {
        promptEditorTitle.textContent = `Edit: ${promptData.name}`;
        promptNameInput.value = promptData.name;
        promptNameInput.disabled = true; // Disable name editing for 'edit' mode
        promptDescriptionInput.value = promptData.description;
        promptContentInput.value = promptData.prompt;
        promptTokenCount.textContent = promptData.tokens || '0';
        promptCost.textContent = promptData.cost || '$0.0000';
        savePromptBtn.disabled = false; // Can save immediately
    } else if (mode === 'copy') {
        promptEditorTitle.textContent = 'Copy Prompt';
        promptDescriptionInput.value = promptData.description;
        promptContentInput.value = promptData.prompt;
        promptTokenCount.textContent = promptData.tokens || '0';
        promptCost.textContent = promptData.cost || '$0.0000';
        // Disable other fields until a valid new name is entered
        promptDescriptionInput.disabled = true;
        promptContentInput.disabled = true;
    }

    handleDescriptionInput(); // Update char counter
    promptEditorModal.classList.remove('hidden');
    const modalContent = promptEditorModal.querySelector('.modal-scroll-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}


/**
 * Handles input in the description textarea to update the character counter.
 */
function handleDescriptionInput() {
    const count = promptDescriptionInput.value.length;
    promptCharCounter.textContent = `${count} / 250`;
    promptCharCounter.classList.toggle('text-red-500', count >= 250);
}

/**
 * Handles the blur event on the prompt name input to validate its uniqueness.
 */
async function handlePromptNameBlur() {
    const name = promptNameInput.value.trim();
    if (!name) return;

    // No need to validate if editing and the name hasn't changed (since it's disabled)
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
        // If in copy mode, enable other fields now that name is valid
        if (promptEditorMode === 'copy') {
            promptDescriptionInput.disabled = false;
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

    if (!text || !geminiKey || !model) return;

    promptTokenCount.textContent = '...';
    promptCost.textContent = '...';

    const tokens = await countTokensWithGemini(text, geminiKey, model);
    const cost = calculateGeminiCost(model, tokens, 0); // Cost is based on input for prompts

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
    const prompt = promptContentInput.value.trim();
    const tokens = promptTokenCount.textContent;
    const cost = promptCost.textContent;

    // Use original filename for edits, generate new one for add/copy
    const filename = (promptEditorMode === 'edit' && currentEditingPrompt) ?
        currentEditingPrompt.filename :
        `${name.toLowerCase().replace(/\s+/g, '-')}.json`;


    const content = {
        name,
        description,
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
        await initializePrompts(); // Refresh the list
    } catch (error) {
        console.error("Failed to save prompt:", error);
        alert(`Error saving prompt: ${error.message}`);
    } finally {
        savePromptBtn.disabled = false;
        savePromptBtn.textContent = 'Save & Close';
    }
}


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