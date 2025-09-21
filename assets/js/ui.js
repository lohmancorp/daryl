/**
 * File: ui.js
 * Description: Contains functions responsible for manipulating the DOM, such as displaying results, updating progress bars, managing modals, etc.
 * Author: D.A.R.Y.L. & Taylor Giddens
 */

// --- UI Functions ---
// This file contains functions responsible for manipulating the DOM,
// such as displaying results, updating progress bars, managing modals, etc.

/**
 * Handles the file upload, parsing it with SheetJS.
 */
function handleFileUpload(event) {
    // ... function content remains the same
    const file = event.target.files[0];
    if (!file) return;

    ticketCountDisplay.classList.add('hidden');
    analysisSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    statsSection.classList.add('hidden');
    newAnalysisContainer.classList.add('hidden');

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {
                type: 'array'
            });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            sheetData = XLSX.utils.sheet_to_json(worksheet);

            if (sheetData.length > 0) {
                const headers = Object.keys(sheetData[0]);
                columnSelect.innerHTML = '<option value="">Select column with Ticket IDs</option>';
                headers.forEach(header => {
                    const option = document.createElement('option');
                    option.value = header;
                    option.textContent = header;
                    columnSelect.appendChild(option);
                });
                columnSelect.disabled = false;
                displayError('', false); // Clear non-fatal errors

                const keywords = ['ticket', 'request', 'problem', 'incident', 'id'];
                const foundHeader = headers.find(h => keywords.some(k => h.toLowerCase().includes(k)));

                if (foundHeader) {
                    columnSelect.value = foundHeader;
                    updateTicketCount(true, foundHeader);
                } else {
                    updateTicketCount(false);
                }
            } else {
                displayError('The uploaded file is empty or could not be read.');
                columnSelect.disabled = true;
            }
        } catch (error) {
            displayError('Error reading the file. Please ensure it is a valid Excel or CSV file.');
            console.error("File read error:", error);
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Updates the UI with the number of tickets found.
 */
function updateTicketCount(wasAutoSelected = null, header = '') {
    // ... function content remains the same
    const selectedColumn = columnSelect.value;
    let message = '';
    let ticketIds = [];

    if (selectedColumn && sheetData.length > 0) {
        ticketIds = sheetData.map(row => String(row[selectedColumn] || '').replace(/\D/g, '')).filter(id => id && id.trim() !== '');
        message = `Found ${ticketIds.length} tickets to analyze.`;
        if (wasAutoSelected) {
            message += `<br><small class="text-green-600 font-normal">Automatically selected column "${header}". You can change this if incorrect.</small>`;
        }
    } else if (wasAutoSelected === false) {
        message = `<small class="text-yellow-600 font-normal">Could not automatically identify ticket column. Please select one manually.</small>`;
    }

    if (message) {
        ticketCountDisplay.innerHTML = message;
        ticketCountDisplay.classList.remove('hidden');
    } else {
        ticketCountDisplay.classList.add('hidden');
    }

    if (ticketIds.length > 0) {
        analysisSection.classList.remove('hidden');
        inProgressControls.classList.remove('hidden');
        startButton.classList.remove('hidden');
        // Ensure pause/cancel are hidden when setting up a new run
        pauseButton.classList.add('hidden');
        cancelButton.classList.add('hidden');
        scrollToElement(analysisSection);
    } else {
        analysisSection.classList.add('hidden');
    }
}

/**
 * Creates the color-coded severity pill HTML.
 */
function getPriorityPill(priority) {
    // ... function content remains the same
    const priorities = {
        1: { text: 'Low', color: 'bg-green-600' },
        2: { text: 'Medium', color: 'bg-yellow-500' },
        3: { text: 'High', color: 'bg-orange-500' },
        4: { text: 'Urgent', color: 'bg-red-600' }
    };
    const { text, color } = priorities[priority] || { text: 'Unknown', color: 'bg-slate-400' };
    return `<p class="px-3 py-1 text-xs font-bold text-white ${color} rounded-full">${text}</p>`;
}

/**
 * Translates a status number to a human-readable string.
 */
function getStatusText(status) {
    // ... function content remains the same
    const statuses = { 2: "Open", 3: "Pending", 4: "Resolved", 5: "Closed" };
    return statuses[status] || 'Unknown';
}

/**
 * Generates the inner HTML for a result card.
 * @param {object} data The combined analysis and ticket data.
 * @returns {string} The HTML string for the card's content.
 */
function generateCardHTML(data) {
    const fsDomain = fsDomainInput.value.trim().replace(/^https?:\/\//, '');
    let deepAnalysisPillHtml = '';

    // Check the cache to see if deep analysis has been completed.
    if (extendedAnalysisCache[data.ticket_id]) {
        const checkmarkSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" class="inline-block ml-1.5 -mr-0.5"><circle cx="12" cy="12" r="11" fill="#22c55e" stroke="#fff" stroke-width="1.5"></circle><path d="M8 12.5l3 3 5-6" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        deepAnalysisPillHtml = `<p class="flex items-center px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded-full">Deep Analysis ${checkmarkSVG}</p>`;
    }

    if (data.error) {
        return `
            <div class="flex justify-between items-center">
                <p class="font-bold text-slate-800">Ticket #${data.ticket_id || data.ticketId}</p>
                <p class="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Error</p>
            </div>
            <p class="mt-2 text-sm text-red-600">${data.error}</p>
        `;
    } else {
        return `
            <div class="flex justify-between items-center">
                <a href="https://${fsDomain}/a/tickets/${data.ticket_id}" target="_blank" class="font-bold text-slate-800 hover:text-indigo-600 hover:underline" onclick="event.stopPropagation()">Ticket #${data.ticket_id}</a>
                <div class="flex items-center space-x-2">
                    ${deepAnalysisPillHtml}
                    ${getPriorityPill(data.priority)}
                </div>
            </div>
            <div class="mt-4 grid grid-cols-[max-content,1fr] gap-y-2 text-sm">
                <div class="font-semibold text-slate-600 text-right pr-2.5">Company Name:</div>
                <div class="text-slate-900 pl-2.5">${data.company_name || 'N/A'}</div>

                <div class="font-semibold text-slate-600 text-right pr-2.5">Problem Summary:</div>
                <div class="text-slate-900 pl-2.5">${data.problem_summary || 'N/A'}</div>
                
                <div class="font-semibold text-slate-600 text-right pr-2.5">Use-Case:</div>
                <div class="text-slate-900 pl-2.5">${data.use_case || 'N/A'}</div>

                <div class="font-semibold text-slate-600 text-right pr-2.5">Product Module:</div>
                <div class="text-slate-900 pl-2.5">${data.product_module || 'N/A'}</div>

                <div class="font-semibold text-slate-600 text-right pr-2.5">Ticket Type:</div>
                <div class="text-slate-900 pl-2.5">${data.type || 'N/A'}</div>

                <div class="font-semibold text-slate-600 text-right pr-2.5">Ticket Status:</div>
                <div class="text-slate-900 pl-2.5">${getStatusText(data.status)}</div>
            </div>
        `;
    }
}


/**
 * Displays a single per-ticket analysis result as a card.
 */
function displayResult(data, rawData) {
    const card = document.createElement('div');
    card.className = 'status-card bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all';
    card.dataset.ticketId = data.ticket_id;

    card.innerHTML = generateCardHTML(data);

    card.addEventListener('dblclick', () => {
        showExtendedDetailsModal(data, rawData);
    });


    resultsContainer.appendChild(card);
    setTimeout(() => card.classList.add('visible'), 10);
}


/**
 * Parses the full Gemini response to separate the Markdown report from CSV data.
 */
function parseOverallReport(reportText) {
    const csvs = [];
    let fullText = reportText;

    // Find the start of the actual markdown report, ignoring any preamble.
    const reportStartMatch = fullText.match(/^#+\s/m);
    if (reportStartMatch) {
        fullText = fullText.substring(reportStartMatch.index);
    }

    // Clean up markdown code fences
    let cleanText = fullText.trim();
    if (cleanText.startsWith('```markdown')) {
        cleanText = cleanText.substring('```markdown'.length).trim();
    } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring('```'.length).trim();
    }
    if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.lastIndexOf('```')).trim();
    }

    let markdownReport = cleanText;

    const csvMarkers = [
        "A. Summary Data (ticket_summary.csv)",
        "B. Tickets for Further Exploration (further_exploration_tickets.csv)"
    ];

    let firstCsvIndex = -1;

    // Find the earliest position of a CSV marker in the report
    for (const marker of csvMarkers) {
        // Use a regex to find the marker, ignoring leading markdown heading characters and whitespace
        const regex = new RegExp(`^#*\\s*${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm');
        const match = markdownReport.match(regex);
        if (match) {
            const index = match.index;
            if (firstCsvIndex === -1 || index < firstCsvIndex) {
                firstCsvIndex = index;
            }
        }
    }

    if (firstCsvIndex !== -1) {
        const reportOnlyText = markdownReport.substring(0, firstCsvIndex).trim();
        let remainingText = markdownReport.substring(firstCsvIndex);

        // Process each CSV section
        csvMarkers.forEach((marker, i) => {
            const nextMarker = csvMarkers[i + 1];
            const startRegex = new RegExp(`^#*\\s*${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm');
            const startMatch = remainingText.match(startRegex);

            if (startMatch) {
                let content = remainingText.substring(startMatch.index + startMatch[0].length);

                if (nextMarker) {
                    const endRegex = new RegExp(`^#*\\s*${nextMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm');
                    const endMatch = content.match(endRegex);
                    if (endMatch) {
                        content = content.substring(0, endMatch.index);
                    }
                }

                const filename = marker.substring(marker.indexOf('(') + 1, marker.indexOf(')'));
                content = content.replace(/^Code snippet\s*/, '').trim();
                if (content.startsWith('```') && content.endsWith('```')) {
                    content = content.substring(content.indexOf('\n') + 1, content.lastIndexOf('```')).trim();
                } else if (content.startsWith('```')) {
                    content = content.substring(content.indexOf('\n') + 1).trim();
                }

                csvs.push({
                    filename,
                    content: content.trim()
                });
            }
        });

        markdownReport = reportOnlyText;
    }

    return {
        markdownReport,
        csvs
    };
}


/**
 * Renders the overall analysis report from Markdown to HTML.
 */
function displayOverallReport(markdownReport) {
    resultsContainer.innerHTML = '';
    const reportContainer = document.createElement('div');
    reportContainer.className = 'prose max-w-none p-6 bg-white rounded-lg shadow-sm border border-slate-200';

    let cleanMarkdown = markdownReport.trim();

    // --- FIX STARTS HERE ---
    // More robust cleaning:
    // 1. Find the actual start of the report (the first H1 heading) to strip any file preamble.
    const reportStartIndex = cleanMarkdown.search(/^#\s/m);
    if (reportStartIndex > 0) { // If the first heading isn't at the very beginning
        cleanMarkdown = cleanMarkdown.substring(reportStartIndex);
    }

    // 2. Now, remove the code fences that might wrap the content.
    if (cleanMarkdown.startsWith('```markdown')) {
        cleanMarkdown = cleanMarkdown.substring('```markdown'.length).trim();
    } else if (cleanMarkdown.startsWith('```')) {
        cleanMarkdown = cleanMarkdown.substring('```'.length).trim();
    }

    if (cleanMarkdown.endsWith('```')) {
        cleanMarkdown = cleanMarkdown.substring(0, cleanMarkdown.lastIndexOf('```')).trim();
    }
    // --- FIX ENDS HERE ---


    if (typeof marked !== 'undefined') {
        const renderer = new marked.Renderer();
        // Robust link renderer to handle potential malformed URLs from the AI
        renderer.link = function(href, title, text) {
            try {
                // Validate the URL before creating a link
                new URL(href);
                const link = marked.Renderer.prototype.link.call(this, href, title, text);
                return link.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
            } catch (e) {
                // If URL is invalid, just return the text without a link
                console.warn(`Invalid URL found in report, rendering as text: ${href}`);
                return text;
            }
        };

        reportContainer.innerHTML = marked.parse(cleanMarkdown, {
            mangle: false,
            headerIds: false,
            renderer: renderer
        });
    } else {
        console.error("marked.js library not found. Falling back to preformatted text.");
        const pre = document.createElement('pre');
        pre.className = 'whitespace-pre-wrap font-mono text-sm';
        pre.textContent = cleanMarkdown;
        reportContainer.appendChild(pre);
    }

    resultsContainer.appendChild(reportContainer);

    if (markdownReport.includes('## Analysis Failed')) {
        playNotificationSound('error');
        showOsNotification('Analysis Failed', 'An error occurred during the overall analysis.');
    }
}


/**
 * Creates and displays download buttons for the generated CSV files and reports.
 */
function displayCsvDownloads(csvs, markdownReport = '', analysisSucceeded = true) {
    downloadContainer.innerHTML = '';

    // Add CSV download buttons
    csvs.forEach(csv => {
        const button = document.createElement('button');
        button.className = "inline-block bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-2 mb-2";
        button.textContent = `Download ${csv.filename}`;
        button.addEventListener('click', () => {
            const blob = new Blob([csv.content], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = csv.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
        downloadContainer.appendChild(button);
    });

    // Add "Copy Report", "Download Report" (PDF), and "Download JSON" buttons if a markdown report is available
    if (markdownReport && analysisSucceeded) {
        // Button 1: Copy Report
        const copyButton = document.createElement('button');
        copyButton.className = "inline-block bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2 mb-2";
        copyButton.textContent = "Copy Report";
        copyButton.addEventListener('click', () => {
            const reportElement = resultsContainer.querySelector('.prose');
            if (!reportElement) return;

            // Use legacy execCommand for broader compatibility (especially in http contexts)
            const reportHTML = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; max-width: 1024px; margin: 0 auto;">${reportElement.innerHTML}</div>`;
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.innerHTML = reportHTML;
            document.body.appendChild(tempContainer);

            const range = document.createRange();
            range.selectNode(tempContainer);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    const originalText = copyButton.textContent;
                    copyButton.textContent = "Copied!";
                    copyButton.classList.add('bg-green-500', 'hover:bg-green-600');
                    copyButton.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
                    setTimeout(() => {
                        copyButton.textContent = originalText;
                        copyButton.classList.remove('bg-green-500', 'hover:bg-green-600');
                        copyButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
                    }, 2000);
                }
            } catch (err) {
                console.error('Failed to copy text.', err);
            }

            window.getSelection().removeAllRanges();
            document.body.removeChild(tempContainer);
        });
        downloadContainer.appendChild(copyButton);

        // Button 2: Download Report (PDF)
        const downloadPdfButton = document.createElement('button');
        downloadPdfButton.className = "inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2 mb-2";
        downloadPdfButton.textContent = "Download Report";
        downloadPdfButton.addEventListener('click', () => {
            const reportElement = resultsContainer.querySelector('.prose');
            const headerElement = document.getElementById('pageHeader');
            if (reportElement && typeof window.html2canvas !== 'undefined' && typeof window.jspdf !== 'undefined') {

                const originalFont = reportElement.style.fontFamily;
                reportElement.style.fontFamily = "'Helvetica', 'Arial', sans-serif";
                headerElement.style.display = 'none';

                requestAnimationFrame(() => {
                    setTimeout(() => {
                        html2canvas(reportElement, {
                            scale: 2,
                            useCORS: true,
                            windowWidth: reportElement.scrollWidth,
                            windowHeight: reportElement.scrollHeight
                        }).then(canvas => {
                            reportElement.style.fontFamily = originalFont;
                            headerElement.style.display = 'flex';

                            const { jsPDF } = window.jspdf;
                            const pdf = new jsPDF('p', 'mm', 'a4');
                            const pdfWidth = pdf.internal.pageSize.getWidth();
                            const pdfHeight = pdf.internal.pageSize.getHeight();
                            const topMargin = 25;
                            const bottomMargin = 25;
                            const leftMargin = 20;
                            const rightMargin = 20;
                            const usableWidth = pdfWidth - leftMargin - rightMargin;
                            const usableHeight = pdfHeight - topMargin - bottomMargin;

                            const imgData = canvas.toDataURL('image/png');
                            const canvasAspectRatio = canvas.height / canvas.width;
                            const totalImgHeight = usableWidth * canvasAspectRatio;

                            let heightLeft = totalImgHeight;
                            let position = 0;

                            const addHeaderFooter = (pdfInstance, pageNum, totalPages) => {
                                pdfInstance.setPage(pageNum);

                                // --- FIX STARTS HERE ---
                                // Add white rectangles to cover the margins and prevent content overlap
                                pdfInstance.setFillColor(255, 255, 255); // Set fill to white
                                pdfInstance.rect(0, 0, pdfWidth, topMargin, 'F'); // Header background
                                pdfInstance.rect(0, pdfHeight - bottomMargin, pdfWidth, bottomMargin, 'F'); // Footer background
                                // --- FIX ENDS HERE ---

                                pdfInstance.setFontSize(10);
                                pdfInstance.setTextColor(100);
                                pdfInstance.text('D.A.R.Y.L. Analysis Report', leftMargin, 15);
                                pdfInstance.text(`Generated: ${new Date().toLocaleDateString()}`, pdfWidth - rightMargin, 15, { align: 'right' });

                                const footerY = pdfHeight - 15;
                                pdfInstance.line(leftMargin, footerY - 5, pdfWidth - rightMargin, footerY - 5);
                                pdfInstance.text(`Page ${pageNum} of ${totalPages}`, pdfWidth / 2, footerY, { align: 'center' });
                            };

                            pdf.addImage(imgData, 'PNG', leftMargin, topMargin, usableWidth, totalImgHeight);
                            heightLeft -= usableHeight;

                            let page = 1;
                            while (heightLeft > 0) {
                                page++;
                                position -= usableHeight;
                                pdf.addPage();
                                pdf.addImage(imgData, 'PNG', leftMargin, position + topMargin, usableWidth, totalImgHeight);
                                heightLeft -= usableHeight;
                            }

                            const totalPages = pdf.internal.getNumberOfPages();
                            for (let i = 1; i <= totalPages; i++) {
                                addHeaderFooter(pdf, i, totalPages);
                            }

                            pdf.save('DARYL-Report.pdf');
                        }).catch(err => {
                            reportElement.style.fontFamily = originalFont;
                            headerElement.style.display = 'flex';
                            console.error("PDF generation failed:", err);
                        });
                    }, 100);
                });
            }
        });
        downloadContainer.appendChild(downloadPdfButton);
    }

    // Always add the JSON download button
    const jsonButton = document.createElement('button');
    jsonButton.className = "inline-block bg-teal-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 mb-2";
    jsonButton.textContent = "Download Retrieved Data (JSON)";
    jsonButton.addEventListener('click', handleDownload);
    downloadContainer.appendChild(jsonButton);


    downloadContainer.classList.remove('hidden');
}

/**
 * Creates and displays the search and download controls for per-ticket results.
 */
function displayPerTicketDownloadsAndSearch() {
    // ... function content remains the same
    perTicketControlsContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-4">
            <div class="text-center">
                <button id="downloadPerTicketCsvBtn" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-700">
                    Download Results (CSV)
                </button>
            </div>
            <div class="relative">
                <input type="text" id="perTicketSearchInput" placeholder="Search results..." class="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg">
                <button id="clearPerTicketSearchBtn" class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
    `;
    perTicketControlsContainer.classList.remove('hidden');

    document.getElementById('downloadPerTicketCsvBtn').addEventListener('click', downloadPerTicketCsv);
    const searchInput = document.getElementById('perTicketSearchInput');
    const clearBtn = document.getElementById('clearPerTicketSearchBtn');
    searchInput.addEventListener('input', handlePerTicketSearch);
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        handlePerTicketSearch({ target: searchInput });
    });
}

/**
 * Handles filtering the per-ticket result cards based on search input.
 */
function handlePerTicketSearch(event) {
    // ... function content remains the same
    const query = event.target.value.toLowerCase().trim();
    const cards = resultsContainer.querySelectorAll('.status-card');
    document.getElementById('clearPerTicketSearchBtn').classList.toggle('hidden', !query);

    cards.forEach(card => {
        const cardText = card.innerText.toLowerCase();
        if (cardText.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Generates and triggers a download for the per-ticket analysis results as a CSV file.
 */
function downloadPerTicketCsv() {
    // ... function content remains the same
    const headers = ["Ticket ID", "Company Name", "Problem Summary", "Use-Case", "Product Module", "Ticket Type", "Ticket Status", "Severity"];
    const rows = allAnalysisResults.map(data => {
        if (data.error) return null;
        return [
            data.ticket_id,
            data.company_name || 'N/A',
            `"${(data.problem_summary || '').replace(/"/g, '""')}"`, // Handle quotes
            data.use_case,
            data.product_module,
            data.type,
            getStatusText(data.status),
            (getPriorityPill(data.priority).match(/>(.*?)</) || [])[1] // Extract text from pill
        ];
    }).filter(Boolean); // Remove null error rows

    const csvContent = "data:text/csv;charset=utf-8," +
        headers.join(",") + "\n" +
        rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "per_ticket_analysis_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


/**
 * Displays an error message in the UI and provides fallback options.
 */
function displayError(message, isFatal = true) {
    // ... function content remains the same
    if (message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        if (isFatal) {
            playNotificationSound('error');
            showOsNotification('Analysis Failed', message);
        }
    } else {
        errorMessage.classList.add('hidden');
    }
}


/**
 * Sets up the UI for manual processing after a fatal Gemini API failure.
 */
function displayManualFallbackUI(message, jobType) {
    // ... function content remains the same
    displayError(message, true); // Display the core error
    resultsSection.classList.remove('hidden');
    loadingIndicator.classList.add('hidden');

    displayPromptForUser(false, jobType === 'overall');

    downloadContainer.innerHTML = '';
    const jsonButton = document.createElement('button');
    jsonButton.className = "inline-block bg-teal-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 mb-2";
    jsonButton.textContent = "Download Retrieved Data (JSON)";
    jsonButton.addEventListener('click', handleDownload);
    downloadContainer.appendChild(jsonButton);
    downloadContainer.classList.remove('hidden');
    scrollToElement(resultsSection);
}



/**
 * Updates a progress bar's width and text content.
 */
function updateProgressBar(type, current, total) {
    const cappedCurrent = Math.min(current, total);
    const percent = total > 0 ? Math.round((cappedCurrent / total) * 100) : 0;
    const bar = type === 'fetch' ? fetchProgressBar : analysisProgressBar;
    const textEl = type === 'fetch' ? fetchProgressText : analysisProgressText;

    bar.style.width = `${percent}%`;
    bar.textContent = `${percent > 0 ? percent + '%' : ''}`;

    let timeString = '';
    if (analysisStartTime) {
        const elapsedTime = formatElapsedTime(Date.now() - analysisStartTime);
        timeString = ` (Elapsed: ${elapsedTime})`;
    }

    textEl.textContent = `Processed ${cappedCurrent} of ${total} tickets.${timeString}`;
}

/**
 * Displays the prompts in a textarea or returns the text.
 */
function displayPromptForUser(returnOnly = false, isOverall = false) {
    let promptText;
    let title;

    // Use the selected prompt if available, otherwise fall back to a generic message.
    if (isOverall && currentPrompt) {
        // For overall analysis, use the selected prompt
        promptText = currentPrompt.prompt;
        title = currentPrompt.name;
        // The prompt text might contain placeholders like [FILENAME_HERE], which we'll handle in the API call, not here.
    } else if (isOverall) {
        // Fallback for overall if no prompt is selected
        promptText = "No prompt was selected for overall analysis. Please select one from the Job Configuration section to use this feature.";
    } else {
        // Default message for per-ticket analysis
        promptText = "A specific prompt for per-ticket analysis is generated for each ticket individually. You can review the structure in the api.js file, function analyzeTicketWithGemini.";
    }

    if (returnOnly) {
        return promptText.trim();
    }

    const reportContainer = document.createElement('div');
    reportContainer.className = 'prose max-w-none p-4 bg-slate-100 rounded-lg border border-slate-200 text-sm';

    // Conditionally add a title for the prompt
    if (title) {
        const titleEl = document.createElement('h3');
        titleEl.className = "text-base font-semibold text-slate-800 mb-2";
        titleEl.textContent = `Prompt for Overall Analysis: ${title}`;
        reportContainer.appendChild(titleEl);
    }

    // Now handle the prompt content
    if (typeof marked !== 'undefined') {
        const renderer = new marked.Renderer();
        renderer.link = (href, title, text) => {
            const link = marked.Renderer.prototype.link.call(renderer, href, title, text);
            return link.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
        };
        reportContainer.innerHTML += marked.parse(promptText.trim(), {
            mangle: false,
            headerIds: false,
            renderer: renderer
        });
    } else {
        const pre = document.createElement('pre');
        pre.className = 'whitespace-pre-wrap font-mono text-xs';
        pre.textContent = promptText.trim();
        reportContainer.appendChild(pre);
    }

    const copyButton = document.createElement('button');
    copyButton.title = 'Copy to clipboard';
    copyButton.className = 'absolute top-2.5 right-2.5 p-2 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors opacity-0 group-hover:opacity-100';
    copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-600"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

    copyButton.addEventListener('click', () => {
        // Use document.execCommand('copy') for broader compatibility in iFrames
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = promptText.trim();
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        try {
            document.execCommand('copy');
            copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => {
                copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2d000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-600"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text.', err);
        } finally {
            document.body.removeChild(tempTextArea);
        }
    });

    promptContainer.innerHTML = '';
    promptContainer.appendChild(reportContainer);
    promptContainer.appendChild(copyButton);
    promptContainer.classList.remove('hidden');
}


// --- Logo Animation Functions ---

function showProcessingAnimation() {
    // ... function content remains the same
    isProcessing = true;
    logoImage.classList.add('hidden');
    logoVideo.classList.remove('hidden');
    logoVideo.play();
}

function hideProcessingAnimation() {
    // ... function content remains the same
    isProcessing = false;
    logoImage.classList.remove('hidden');
    logoVideo.classList.add('hidden');
    logoVideo.currentTime = 0;
}

// --- UI Helper Functions ---

function scrollToElement(element, offset = 20) {
    // ... function content remains the same
    if (!element) return;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

function updateSettingsBadge() {
    // ... function content remains the same
    let missingCount = 0;
    const isDummy = dummyModeCheckbox.checked;

    if (!fsDomainInput.value.trim()) missingCount++;
    if (!fsApiKeyInput.value.trim()) missingCount++;

    if (!isDummy) {
        if (!geminiApiKeyInput.value.trim()) missingCount++;
        if (!geminiModelSelect.value.trim()) missingCount++;

        const jobType = document.querySelector('input[name="jobType"]:checked').value;
        if (jobType === 'perTicket') {
            if (!productModulesInput.value.trim()) missingCount++;
            if (!useCasesInput.value.trim()) missingCount++;
        }
    }

    if (missingCount > 0) {
        settingsBadge.textContent = missingCount;
        settingsBadge.classList.remove('hidden');
        configOverlay.classList.remove('hidden');
        fileUploadInput.disabled = true;
    } else {
        settingsBadge.classList.add('hidden');
        configOverlay.classList.add('hidden');
        fileUploadInput.disabled = false;
    }
}

function toggleRequiredIndicators() {
    // ... function content remains the same
    const isDummy = dummyModeCheckbox.checked;
    geminiRequiredStar.classList.toggle('hidden', isDummy);
    geminiModelRequiredStar.classList.toggle('hidden', isDummy);
    modulesRequiredStar.classList.toggle('hidden', isDummy);
    useCasesRequiredStar.classList.toggle('hidden', isDummy);
}

/**
 * Displays the final analysis statistics.
 */
function displayAnalysisStats() {
    const totalTime = analysisEndTime - analysisStartTime;
    e2eTimeDisplay.textContent = formatElapsedTime(totalTime);

    const atr = parseInt(atrInput.value, 10);
    const ticketsAnalyzed = allFetchedData.filter(t => !t.error).length;

    // Standard calculation for ticket review time saved
    let baseTimeSaved = ticketsAnalyzed * atr;

    // Add 30% overhead for manual report building/consolidation
    let totalTimeSaved = baseTimeSaved * 1.30;

    // Add time for any "Deeper Analysis" clicks, which represents a full manual review saved
    if (extendedAnalysesCount > 0) {
        const extendedTimeSaved = extendedAnalysesCount * atr * 1.30; // Also add overhead here
        totalTimeSaved += extendedTimeSaved;
    }

    timeSavedDisplay.textContent = formatTimeSaved(totalTimeSaved);


    const model = geminiModelSelect.value;
    apiCostDisplay.textContent = calculateGeminiCost(model, totalInputTokens, totalOutputTokens);

    statsSection.classList.remove('hidden');
}



// --- Modal Functions ---

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


async function openFieldLoader(targetId) {
    // ... function content remains the same
    currentTargetTextarea = document.getElementById(targetId);
    fieldLoaderModal.classList.remove('hidden');
    modalContent.classList.add('hidden');
    modalError.classList.add('hidden');
    modalSpinner.classList.remove('hidden');

    const domain = fsDomainInput.value.trim();
    const apiKey = fsApiKeyInput.value.trim();

    if (!domain || !apiKey) {
        modalError.textContent = 'Please enter your FreshService Domain and API Key before loading options.';
        modalError.classList.remove('hidden');
        modalSpinner.classList.add('hidden');
        return;
    }

    if (!sanitizeApiKey(apiKey)) {
        modalError.textContent = 'The FreshService API Key appears to contain invalid characters (like spaces). Please check your key.';
        modalError.classList.remove('hidden');
        modalSpinner.classList.add('hidden');
        return;
    }

    try {
        const fields = await fetchTicketFields();
        const selectableFields = fields.filter(field => field.choices && field.choices.length > 0);
        fieldSelect.innerHTML = '<option value="">-- Select a Field --</option>';
        selectableFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field.id;
            option.textContent = field.label;
            fieldSelect.appendChild(option);
        });
        fieldChoicesPreview.textContent = 'Select a field to see its options.';
        modalUseBtn.disabled = true;
        modalContent.classList.remove('hidden');
    } catch (error) {
        modalError.textContent = `Error: ${error.message}. Check domain/API key and API response structure.`;
        modalError.classList.remove('hidden');
    } finally {
        modalSpinner.classList.add('hidden');
    }
}

function closeFieldLoader() {
    // ... function content remains the same
    fieldLoaderModal.classList.add('hidden');
    currentTargetTextarea = null;
}

function updateFieldChoicesPreview() {
    // ... function content remains the same
    const selectedFieldId = fieldSelect.value;
    if (!selectedFieldId) {
        fieldChoicesPreview.textContent = 'Select a field to see its options.';
        modalUseBtn.disabled = true;
        return;
    }
    const selectedField = ticketFieldsCache.find(f => f.id == selectedFieldId);
    if (selectedField) {
        fieldChoicesPreview.innerHTML = selectedField.choices.map(choice => `<div>${choice.value}</div>`).join('');
        modalUseBtn.disabled = false;
    }
}

function useSelectedFieldOptions() {
    // ... function content remains the same
    const selectedFieldId = fieldSelect.value;
    const selectedField = ticketFieldsCache.find(f => f.id == selectedFieldId);
    if (currentTargetTextarea && selectedField) {
        const optionsText = selectedField.choices.map(choice => choice.value).join('\n');
        currentTargetTextarea.value = optionsText;
    }
    closeFieldLoader();
}

function updateModelDropdown() {
    // ... function content remains the same
    const originalSelection = localStorage.getItem('geminiModel');
    const modelsToShow = availableGeminiModels;

    geminiModelSelect.innerHTML = '';

    if (modelsToShow.length === 0) {
        geminiModelSelect.innerHTML = `<option value="">No compatible models found</option>`;
        return;
    }

    modelsToShow.forEach(model => {
        const option = document.createElement('option');
        const modelId = model.name.split('/')[1];
        option.value = modelId;
        option.textContent = model.displayName;
        geminiModelSelect.appendChild(option);
    });

    if (originalSelection && modelsToShow.some(m => m.name.split('/')[1] === originalSelection)) {
        geminiModelSelect.value = originalSelection;
    } else if (modelsToShow.length > 0) {
        geminiModelSelect.selectedIndex = 0;
    }

    saveSettings();
    updateSettingsBadge();
}

/**
 * Displays the selected prompt's description.
 * @param {object} prompt - The prompt object to display.
 */
function displaySelectedPromptDescription(prompt) {
    if (prompt && prompt.description) {
        promptDescriptionText.textContent = prompt.description;
        promptDescriptionContainer.classList.remove('hidden');
    } else {
        promptDescriptionContainer.classList.add('hidden');
    }
}

/**
 * Shows the extended details modal and triggers the secondary analysis.
 */
async function showExtendedDetailsModal(analyzedData, rawFetchedData) {
    if (!rawFetchedData) {
        console.error("Cannot show extended details: raw fetched data is missing.", analyzedData);
        alert("An error occurred: Could not find the complete data for this ticket to perform a detailed analysis.");
        return;
    }

    const fsDomain = fsDomainInput.value.trim().replace(/^https?:\/\//, '');
    extendedTicketModalTitle.innerHTML = `Details for <a href="https://${fsDomain}/a/tickets/${analyzedData.ticket_id}" target="_blank" class="text-indigo-600 hover:underline">Ticket #${analyzedData.ticket_id}</a>`;

    extendedTicketModalContent.innerHTML = `
        <div class="space-y-3">
            <div class="grid grid-cols-[max-content,1fr] gap-y-2 text-sm">
                <!-- ... content from analyzedData ... -->
                <div class="font-semibold text-slate-600 text-right pr-2.5">Company Name:</div><div class="text-slate-900 pl-2.5">${analyzedData.company_name || 'N/A'}</div>
                <div class="font-semibold text-slate-600 text-right pr-2.5">Problem Summary:</div><div class="text-slate-900 pl-2.5">${analyzedData.problem_summary || 'N/A'}</div>
                <div class="font-semibold text-slate-600 text-right pr-2.5">Use-Case:</div><div class="text-slate-900 pl-2.5">${analyzedData.use_case || 'N/A'}</div>
                <div class="font-semibold text-slate-600 text-right pr-2.5">Product Module:</div><div class="text-slate-900 pl-2.5">${analyzedData.product_module || 'N/A'}</div>
                <div class="font-semibold text-slate-600 text-right pr-2.5">Ticket Type:</div><div class="text-slate-900 pl-2.5">${analyzedData.type || 'N/A'}</div>
                <div class="font-semibold text-slate-600 text-right pr-2.5">Ticket Status:</div><div class="text-slate-900 pl-2.5">${getStatusText(analyzedData.status)}</div>
            </div>
            <hr>
            <div id="extendedAnalysisContent">
                <!-- Spinner or cached content will go here -->
            </div>
            <div class="border-t pt-4 flex justify-end">
                 <button id="modalCloseFooterBtn" class="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Close</button>
            </div>
        </div>
    `;

    document.getElementById('modalCloseFooterBtn').addEventListener('click', () => extendedTicketModal.classList.add('hidden'));
    extendedTicketModal.classList.remove('hidden');
    const extendedContent = document.getElementById('extendedAnalysisContent');

    // Check cache first
    if (extendedAnalysisCache[analyzedData.ticket_id]) {
        const cachedResult = extendedAnalysisCache[analyzedData.ticket_id];
        extendedContent.innerHTML = `
            <div class="space-y-3">
                <div><h4 class="font-semibold text-slate-800 text-base mb-1">Root Cause Analysis</h4><div class="text-sm text-slate-700 prose max-w-none">${marked.parse(cachedResult.root_cause)}</div></div>
                <div><h4 class="font-semibold text-slate-800 text-base mb-1">Suggested Next Steps</h4><div class="text-sm text-slate-700 prose max-w-none">${marked.parse(cachedResult.next_steps)}</div></div>
                <div><h4 class="font-semibold text-slate-800 text-base mb-1">Preventative Measures</h4><div class="text-sm text-slate-700 prose max-w-none">${marked.parse(cachedResult.preventative_measures)}</div></div>
            </div>`;
        return;
    }

    // If not cached, show spinner and fetch
    extendedContent.innerHTML = `<div class="flex items-center justify-center p-4"><div class="dot-flashing"></div><span class="ml-4 text-slate-600">Performing deeper analysis...</span></div>`;

    try {
        const geminiKey = geminiApiKeyInput.value.trim();
        const selectedModel = geminiModelSelect.value;
        const { result: extendedResult, usage } = await analyzeTicketForExtendedDetails(rawFetchedData, geminiKey, selectedModel);

        // Cache the result
        extendedAnalysisCache[analyzedData.ticket_id] = extendedResult;

        // Update stats
        totalInputTokens += usage.input;
        totalOutputTokens += usage.output;
        extendedAnalysesCount++;
        displayAnalysisStats();

        // Update the card in the main view to show the new pill
        const cardToUpdate = resultsContainer.querySelector(`.status-card[data-ticket-id="${analyzedData.ticket_id}"]`);
        if (cardToUpdate) {
            cardToUpdate.innerHTML = generateCardHTML(analyzedData);
        }


        if (extendedContent) { // Check if modal is still open
            extendedContent.innerHTML = `
                <div class="space-y-3">
                    <div><h4 class="font-semibold text-slate-800 text-base mb-1">Root Cause Analysis</h4><div class="text-sm text-slate-700 prose max-w-none">${marked.parse(extendedResult.root_cause)}</div></div>
                    <div><h4 class="font-semibold text-slate-800 text-base mb-1">Suggested Next Steps</h4><div class="text-sm text-slate-700 prose max-w-none">${marked.parse(extendedResult.next_steps)}</div></div>
                    <div><h4 class="font-semibold text-slate-800 text-base mb-1">Preventative Measures</h4><div class="text-sm text-slate-700 prose max-w-none">${marked.parse(extendedResult.preventative_measures)}</div></div>
                </div>`;
        }
    } catch (error) {
        console.error("Extended analysis failed:", error);
        if (extendedContent) { // Check if modal is still open
            extendedContent.innerHTML = `<div class="text-red-600 bg-red-100 p-3 rounded-md"><h4 class="font-bold">Deeper Analysis Failed</h4><p>${error.message}</p></div>`;
        }
    }
}