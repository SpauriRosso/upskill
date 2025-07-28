/**
 * DOM Utility functions for common operations
 */

/**
 * Get an element by its ID
 * @param {string} id - Element ID
 * @returns {HTMLElement} - The DOM element
 */
export const getById = (id) => document.getElementById(id);

/**
 * Show an element by removing the 'hidden' class
 * @param {string|HTMLElement} element - Element ID or DOM element
 */
export const showElement = (element) => {
    const el = typeof element === 'string' ? getById(element) : element;
    if (el) el.classList.remove('hidden');
};

/**
 * Hide an element by adding the 'hidden' class
 * @param {string|HTMLElement} element - Element ID or DOM element
 */
export const hideElement = (element) => {
    const el = typeof element === 'string' ? getById(element) : element;
    if (el) el.classList.add('hidden');
};

/**
 * Set the text content of an element
 * @param {string|HTMLElement} element - Element ID or DOM element
 * @param {string} text - Text to set
 */
export const setText = (element, text) => {
    const el = typeof element === 'string' ? getById(element) : element;
    if (el) el.textContent = text;
};

/**
 * Format XP value to human-readable format (bytes, KB, MB)
 * @param {number} xp - XP amount
 * @returns {string} - Formatted XP string
 */
export const formatXp = (xp) => {
    if (xp >= 1000000) { // Megabytes
        return (xp / 1000000).toFixed(1) + ' MB';
    } else if (xp >= 1000) { // Kilobytes
        return (xp / 1000).toFixed(1) + ' KB';
    } else { // Bytes (raw XP)
        return xp.toLocaleString() + ' XP';
    }
};

/**
 * Extract project name from a path
 * @param {string} path - Path string
 * @returns {string} - Formatted project name
 */
export const getProjectNameFromPath = (path) => {
    if (!path) return "Unknown Project";
    const parts = path.split('/');
    let projectName = parts[parts.length - 1] || "Unnamed Project";
    // If the last part is numeric (like an ID) or empty, try the second to last part
    if ((projectName === "" || projectName.match(/^\d+$/)) && parts.length > 1) {
        projectName = parts[parts.length - 2] || "Unnamed Project";
    }
    projectName = projectName.replace(/^piscine-/, '').replace(/^quest-/, '');
    return projectName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

/**
 * Add event listener with proper binding
 * @param {string|HTMLElement} element - Element ID or DOM element
 * @param {string} event - Event name (e.g., 'click')
 * @param {Function} handler - Event handler function
 * @param {Object} context - Context to bind the handler to
 */
export const addEvent = (element, event, handler, context) => {
    const el = typeof element === 'string' ? getById(element) : element;
    if (el) {
        const boundHandler = context ? handler.bind(context) : handler;
        el.addEventListener(event, boundHandler);
    }
};

/**
 * Create a debounced function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};