/**
 * File: config.js
 * Description: Contains all DOM element references and global state variables for the application.
 * Author: D.A.R.Y.L. & Taylor Giddens
 */

// --- DOM Element References ---
// This file contains all references to DOM elements and global state variables.

// Configuration and Control Elements
const fsDomainInput = document.getElementById('fsDomain');
const fsApiKeyInput = document.getElementById('fsApiKey');
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const geminiModelSelect = document.getElementById('geminiModelSelect');
const refreshGeminiModelsBtn = document.getElementById('refreshGeminiModelsBtn');
const apiDelayInput = document.getElementById('apiDelay');
const rateLimitDelayInput = document.getElementById('rateLimitDelay');
const maxRetriesInput = document.getElementById('maxRetries');
const atrInput = document.getElementById('atr');
const productModulesInput = document.getElementById('productModules');
const useCasesInput = document.getElementById('useCases');
const loadModulesBtn = document.getElementById('loadModulesBtn');
const loadUseCasesBtn = document.getElementById('loadUseCasesBtn');
const dummyModeCheckbox = document.getElementById('dummyMode');
const fileUploadInput = document.getElementById('fileUpload');
const columnSelect = document.getElementById('columnSelect');
const ticketCountDisplay = document.getElementById('ticketCountDisplay');
const extractionProfileSelect = document.getElementById('extractionProfileSelect');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const cancelButton = document.getElementById('cancelButton');
const newAnalysisButton = document.getElementById('newAnalysisButton');
const perTicketRadio = document.getElementById('perTicketRadio');
const overallRadio = document.getElementById('overallRadio');

// Section and Container Elements
const pageHeader = document.getElementById('pageHeader');
const newAnalysisContainer = document.getElementById('newAnalysisContainer');
const inProgressControls = document.getElementById('inProgressControls');
const errorMessage = document.getElementById('errorMessage');
const configSection = document.getElementById('configSection');
const configOverlay = document.getElementById('configOverlay');
const openSettingsFromOverlayBtn = document.getElementById('openSettingsFromOverlayBtn');
const analysisSection = document.getElementById('analysisSection');
const resultsSection = document.getElementById('resultsSection');
const statsSection = document.getElementById('statsSection');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsContainer = document.getElementById('resultsContainer');
const perTicketControlsContainer = document.getElementById('perTicketControlsContainer');
const fetchProgressContainer = document.getElementById('fetchProgressContainer');
const analysisProgressContainer = document.getElementById('analysisProgressContainer');
const downloadContainer = document.getElementById('downloadContainer');
const promptContainer = document.getElementById('promptContainer');

// Progress Bar Elements
const fetchProgressBar = document.getElementById('fetchProgressBar');
const fetchProgressText = document.getElementById('fetchProgressText');
const analysisProgressBar = document.getElementById('analysisProgressBar');
const analysisProgressText = document.getElementById('analysisProgressText');

// Stats Display Elements
const e2eTimeDisplay = document.getElementById('e2eTimeDisplay');
const timeSavedDisplay = document.getElementById('timeSavedDisplay');
const apiCostDisplay = document.getElementById('apiCostDisplay');

// Logo Animation References
const logoContainer = document.getElementById('logoContainer');
const logoImage = document.getElementById('logoImage');
const logoVideo = document.getElementById('logoVideo');

// Menu References
const menuContainer = document.getElementById('menuContainer');
const menuButton = document.getElementById('menuButton');
const menuDropdown = document.getElementById('menuDropdown');
const openSettingsMenuItem = document.getElementById('openSettingsMenuItem');
const openPromptsMenuItem = document.getElementById('openPromptsMenuItem');

// Settings Modal References
const settingsBadge = document.getElementById('settingsBadge');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const saveSettingsButton = document.getElementById('saveSettingsButton');
const geminiRequiredStar = document.getElementById('geminiRequiredStar');
const geminiModelRequiredStar = document.getElementById('geminiModelRequiredStar');
const modulesRequiredStar = document.getElementById('modulesRequiredStar');
const useCasesRequiredStar = document.getElementById('useCasesRequiredStar');

// Prompts List Modal References
const promptsModal = document.getElementById('promptsModal');
const closePromptsModalBtn = document.getElementById('closePromptsModalBtn');
const promptSearchInput = document.getElementById('promptSearchInput');
const clearPromptSearchBtn = document.getElementById('clearPromptSearchBtn');
const addPromptBtn = document.getElementById('addPromptBtn');
const promptsTableBody = document.getElementById('promptsTableBody');
const noPromptsMessage = document.getElementById('noPromptsMessage');

// Prompt Editor Modal References
const promptEditorModal = document.getElementById('promptEditorModal');
const closePromptEditorBtn = document.getElementById('closePromptEditorBtn');
const promptEditorTitle = document.getElementById('promptEditorTitle');
const promptNameInput = document.getElementById('promptNameInput');
const promptNameValidation = document.getElementById('promptNameValidation');
const promptDescriptionInput = document.getElementById('promptDescriptionInput');
const promptCharCounter = document.getElementById('promptCharCounter');
const promptContentInput = document.getElementById('promptContentInput');
const promptTokenCount = document.getElementById('promptTokenCount');
const promptCost = document.getElementById('promptCost');
const savePromptBtn = document.getElementById('savePromptBtn');

// Delete Prompt Modal References
const deletePromptModal = document.getElementById('deletePromptModal');
const deletePromptFilename = document.getElementById('deletePromptFilename');
const deleteConfirmationInput = document.getElementById('deleteConfirmationInput');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');


// Privacy Settings References
const scrubEmailsToggle = document.getElementById('scrubEmails');
const scrubIpsToggle = document.getElementById('scrubIps');
const scrubPhonesToggle = document.getElementById('scrubPhones');
const scrubNamesToggle = document.getElementById('scrubNames');
const scrubCompaniesToggle = document.getElementById('scrubCompanies');
const piiToggles = [scrubEmailsToggle, scrubIpsToggle, scrubPhonesToggle, scrubNamesToggle, scrubCompaniesToggle];

// Field Loader Modal References
const fieldLoaderModal = document.getElementById('fieldLoaderModal');
const modalSpinner = document.getElementById('modalSpinner');
const modalContent = document.getElementById('modalContent');
const modalError = document.getElementById('modalError');
const fieldSelect = document.getElementById('fieldSelect');
const fieldChoicesPreview = document.getElementById('fieldChoicesPreview');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalUseBtn = document.getElementById('modalUseBtn');

// Extraction Settings Modal References
const configureExtractionBtn = document.getElementById('configureExtractionBtn');
const extractionSettingsModal = document.getElementById('extractionSettingsModal');
const closeExtractionSettingsBtn = document.getElementById('closeExtractionSettingsBtn');
const cancelExtractionSettingsBtn = document.getElementById('cancelExtractionSettingsBtn');
const saveExtractionSettingsBtn = document.getElementById('saveExtractionSettingsBtn');
const resetExtractionBtn = document.getElementById('resetExtractionBtn');
const extractionLightTabBtn = document.getElementById('extractionLightTabBtn');
const extractionExtendedTabBtn = document.getElementById('extractionExtendedTabBtn');
const fieldSearchInput = document.getElementById('fieldSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const fieldListContainer = document.getElementById('fieldListContainer');
const conversationFilterContainer = document.getElementById('conversationFilterContainer');

// Extended Ticket Details Modal References
const extendedTicketModal = document.getElementById('extendedTicketModal');
const extendedTicketModalTitle = document.getElementById('extendedTicketModalTitle');
const extendedTicketModalContent = document.getElementById('extendedTicketModalContent');
const closeExtendedTicketModalBtn = document.getElementById('closeExtendedTicketModalBtn');


// --- Global State Variables ---
let sheetData = []; // To store parsed Excel data
let allFetchedData = []; // To store retrieved ticket data
let allAnalysisResults = []; // To store final, analyzed, and enriched ticket data
let extendedAnalysisCache = {}; // To cache deep-dive analysis results
let ticketFieldsCache = []; // To cache fetched ticket fields
let companyDataCache = null; // To cache fetched company/department data
let availableGeminiModels = []; // To cache all available models
let allPrompts = []; // To cache all loaded prompt data
let promptEditorMode = 'add'; // 'add', 'edit', or 'copy'
let currentEditingPrompt = null; // Stores the prompt object being edited/copied
let promptToDelete = null; // Stores the prompt object to be deleted

// Note: lightExtractSchema and extendedExtractSchema are declared in schemas.js
let currentTargetTextarea = null; // To know which textarea to populate
let isPaused = false;
let isCancelled = false;
let isProcessing = false; // State for logo animation
let analysisStartTime;
let analysisEndTime;
let timerInterval;
let totalInputTokens = 0;
let totalOutputTokens = 0;
let extendedAnalysesCount = 0;


// --- Global Counters for Progress ---
let fetchedCount = 0;
let analyzedCount = 0;