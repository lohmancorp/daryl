/**
 * File: extraction.js
 * Description: Manages the UI and logic for the configurable data extraction profiles.
 * Author: D.A.R.Y.L. & Taylor Giddens
 */

let activeExtractionProfile = 'light';

/**
 * Opens the extraction settings modal and initializes it.
 */
function openExtractionSettingsModal() {
    extractionSettingsModal.classList.remove('hidden');

    // Check if schemas are loaded
    if (typeof sampleTicketData === 'undefined' || typeof sampleConversationData === 'undefined' || typeof definitionsData === 'undefined') {
        fieldListContainer.innerHTML = `<div class="text-red-500 p-4">Error: Schema files were not loaded correctly. Make sure 'assets/js/schemas.js' is included in index.html before other scripts.</div>`;
        return;
    }

    // Initial population for the default active tab
    try {
        switchExtractionTab(activeExtractionProfile);
    } catch (error) {
        console.error("Error populating extraction settings:", error);
        fieldListContainer.innerHTML = `<div class="text-red-500 p-4">An unexpected error occurred: ${error.message}</div>`;
    }
}


/**
 * Handles switching between the 'light' and 'extended' profile tabs.
 * @param {string} profile The profile to switch to ('light' or 'extended').
 */
function switchExtractionTab(profile) {
    activeExtractionProfile = profile;

    // Update tab button styles
    if (profile === 'light') {
        extractionLightTabBtn.classList.add('bg-slate-200', 'font-semibold');
        extractionLightTabBtn.classList.remove('bg-white');
        extractionExtendedTabBtn.classList.remove('bg-slate-200', 'font-semibold');
        extractionExtendedTabBtn.classList.add('bg-white');

    } else {
        extractionExtendedTabBtn.classList.add('bg-slate-200', 'font-semibold');
        extractionExtendedTabBtn.classList.remove('bg-white');
        extractionLightTabBtn.classList.remove('bg-slate-200', 'font-semibold');
        extractionLightTabBtn.classList.add('bg-white');
    }

    // Repopulate the checklist for the selected profile
    populateFieldChecklist();
}

/**
 * Generates and displays the hierarchical field checklist based on the active profile.
 */
function populateFieldChecklist() {
    const activeSchema = (activeExtractionProfile === 'light') ? lightExtractSchema : extendedExtractSchema;

    let html = '<div class="space-y-2">';
    html += '<h3 class="text-lg font-semibold text-slate-800 border-b pb-2 mb-2">Ticket Fields</h3>';
    html += buildChecklistHTML(sampleTicketData.ticket, 'ticket', activeSchema.ticket || {}, 0);

    html += '<h3 class="text-lg font-semibold text-slate-800 border-b pb-2 mt-4 mb-2">Conversation Fields</h3>';
    html += buildChecklistHTML(sampleConversationData.conversations[0], 'conversations', activeSchema.conversations || {}, 0);
    html += '</div>';

    fieldListContainer.innerHTML = html;
}

/**
 * Recursively builds the HTML for the checklist.
 * @param {object} obj The object to traverse for fields.
 * @param {string} path The current path (e.g., 'ticket.custom_fields').
 * @param {object} schema The current selection schema for this path.
 * @param {number} level The indentation level.
 * @returns {string} The generated HTML string.
 */
function buildChecklistHTML(obj, path, schema, level) {
    let html = '';
    const keys = Object.keys(obj);

    for (const key of keys) {
        const currentPath = `${path}.${key}`;
        const definition = definitionsData.fields[currentPath];
        const isParent = typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]);

        // For parent nodes, check if any child is selected to determine its state
        const isChecked = isParent ?
            (schema[key] && Object.keys(schema[key]).length > 0) :
            !!(schema && schema[key]);

        const helpText = definition ? `<p class="text-xs text-slate-500 ml-8">${definition.description || ''}</p>` : '';
        const example = definition && definition.example ? `<span class="text-xs text-slate-400 ml-2 italic">e.g., ${definition.example}</span>` : '';
        const labelText = (definition && definition.label) ? definition.label : key;


        html += `<div style="margin-left: ${level * 20}px;" class="field-item py-1 group" data-path="${currentPath}" data-label="${labelText.toLowerCase()}" data-key="${key.toLowerCase()}">
                    <label class="flex items-center text-sm cursor-pointer">
                        <input type="checkbox" data-path="${currentPath}" onchange="handleCheckboxChange(event)" ${isChecked ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-3">
                        <span class="font-medium text-slate-700">${labelText}</span>
                        ${example}
                    </label>
                    ${helpText}
                 `;

        if (isParent) {
            html += buildChecklistHTML(obj[key], currentPath, schema[key] || {}, level + 1);
        }

        html += '</div>';
    }
    return html;
}


/**
 * Handles clicks on any checkbox, implementing parent/child selection logic.
 * @param {Event} event The click event.
 */
function handleCheckboxChange(event) {
    const checkbox = event.target;
    const path = checkbox.dataset.path;
    const isChecked = checkbox.checked;

    // Update all children of this checkbox
    const parentDiv = checkbox.closest('.field-item');
    const childCheckboxes = parentDiv.querySelectorAll(`input[data-path^="${path}."]`);
    childCheckboxes.forEach(child => {
        child.checked = isChecked;
    });

    // If a child is unchecked, uncheck all its parents
    if (!isChecked) {
        let pathParts = path.split('.');
        while (pathParts.length > 1) {
            pathParts.pop();
            const parentPath = pathParts.join('.');
            const parentCheckbox = document.querySelector(`input[data-path="${parentPath}"]`);
            if (parentCheckbox) {
                parentCheckbox.checked = false;
            }
        }
    }

    // Propagate changes from 'light' to 'extended' profile
    if (activeExtractionProfile === 'light' && isChecked) {
        // Temporarily build a schema from the UI to update the extended one
        const currentLightSchema = buildSchemaFromUI('light');
        // Deep merge the light schema into the extended one
        extendedExtractSchema = mergeSchemas(extendedExtractSchema, currentLightSchema);
    }
}

/**
 * Helper function to deep merge schemas for propagation.
 */
function mergeSchemas(target, source) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] instanceof Object && key in target) {
                target[key] = mergeSchemas(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
}


/**
 * Filters the field list based on the search input, including a deep search.
 */
function handleFieldSearch() {
    const query = fieldSearchInput.value.toLowerCase().trim();
    const items = document.querySelectorAll('#fieldListContainer .field-item');
    clearSearchBtn.classList.toggle('hidden', !query);

    if (!query) {
        items.forEach(item => item.style.display = '');
        return;
    }

    const visiblePaths = new Set();

    items.forEach(item => {
        const path = item.dataset.path.toLowerCase();
        const label = item.dataset.label;
        const key = item.dataset.key;

        if (path.includes(query) || label.includes(query) || key.includes(query)) {
            // Add this path and all its parent paths to the visible set
            let pathParts = path.split('.');
            while (pathParts.length > 0) {
                visiblePaths.add(pathParts.join('.'));
                pathParts.pop();
            }
        }
    });

    items.forEach(item => {
        item.style.display = visiblePaths.has(item.dataset.path.toLowerCase()) ? '' : 'none';
    });
}


/**
 * Saves the current state of the checkboxes to the appropriate global schema variable.
 */
function saveExtractionSettings() {
    if (activeExtractionProfile === 'light') {
        lightExtractSchema = buildSchemaFromUI('light');
    } else {
        extendedExtractSchema = buildSchemaFromUI('extended');
    }

    saveSettings(); // Persist to localStorage
    extractionSettingsModal.classList.add('hidden');
}


/**
 * Builds a schema object from the current state of the UI checkboxes.
 * @param {string} profile - 'light' or 'extended' (though it only reads from the DOM).
 * @returns {object} The newly constructed schema.
 */
function buildSchemaFromUI(profile) {
    const newSchema = {};
    const checkboxes = fieldListContainer.querySelectorAll('input[type="checkbox"]:checked');

    checkboxes.forEach(cb => {
        const pathParts = cb.dataset.path.split('.');
        let currentLevel = newSchema;
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            if (i === pathParts.length - 1) {
                currentLevel[part] = true;
            } else {
                currentLevel[part] = currentLevel[part] || {};
                currentLevel = currentLevel[part];
            }
        }
    });
    return newSchema;
}

/**
 * Resets the active extraction profile to its default state.
 */
function resetActiveExtractionProfile() {
    const defaults = getDefaultSchemas();
    if (activeExtractionProfile === 'light') {
        lightExtractSchema = JSON.parse(JSON.stringify(defaults.light));
    } else {
        extendedExtractSchema = JSON.parse(JSON.stringify(defaults.extended));
    }
    populateFieldChecklist(); // Refresh the UI with the reset schema
}