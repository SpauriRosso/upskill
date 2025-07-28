/**
 * XP Chart Component
 * Renders a bar chart showing XP by project
 */
import { getProjectNameFromPath } from '../utils/dom.utils.js';

export class XpChartComponent {
    /**
     * Constructor
     * @param {HTMLElement} svgElement - The SVG element to render the chart in
     */
    constructor(svgElement) {
        this.svgElement = svgElement;
    }

    /**
     * Render the XP by project chart
     * @param {Array} xpTransactions - Array of XP transactions
     */
    render(xpTransactions) {
        if (!this.svgElement) return;
        
        // Process data
        const projectXP = this.processData(xpTransactions);
        const projects = Object.entries(projectXP);
        
        if (projects.length === 0) {
            this.renderEmptyState("No project XP data available");
            return;
        }

        projects.sort((a, b) => b[1] - a[1]);
        const topProjects = projects.slice(0, 10);

        this.svgElement.innerHTML = ''; // Clear previous chart

        // Get dimensions
        const dimensions = this.calculateDimensions();
        if (!dimensions) {
            this.renderEmptyState("Chart cannot be rendered (too small).");
            return;
        }

        const { svgWidth, svgHeight, margin, chartWidth, chartHeight } = dimensions;

        // Calculate scales
        const maxXP = Math.max(...topProjects.map(p => p[1]), 0);
        if (maxXP === 0 && topProjects.length > 0) {
            this.renderEmptyState("All projects have 0 XP");
            return;
        }

        const barPadding = 0.3; // Relative padding
        const barWidth = chartWidth / topProjects.length * (1 - barPadding);
        const scaleY = val => chartHeight - (val / (maxXP || 1)) * chartHeight; // Prevent division by zero

        // Render X-axis labels
        this.renderXAxisLabels(topProjects, barWidth, barPadding, chartWidth, margin, svgHeight);
        
        // Render Y-axis with grid lines
        this.renderYAxis(maxXP, chartWidth, chartHeight, margin);
        
        // Render bars
        this.renderBars(topProjects, barWidth, barPadding, chartWidth, chartHeight, margin, scaleY);
        
        // Define gradient for bars
        this.defineGradient();
    }

    /**
     * Process raw transaction data into project XP totals
     * @param {Array} xpTransactions - Array of XP transactions
     * @returns {Object} - Object with project names as keys and XP totals as values
     */
    processData(xpTransactions) {
        const projectXP = {};
        // Filter for actual XP transactions with a valid amount for the chart
        const filteredXpTransactions = xpTransactions.filter(tx => 
            (!tx.type || tx.type === 'xp') && 
            typeof tx.amount === 'number' && 
            tx.amount > 0
        );

        filteredXpTransactions.forEach(tx => {
            const projectName = getProjectNameFromPath(tx.path);
            projectXP[projectName] = (projectXP[projectName] || 0) + tx.amount;
        });

        return projectXP;
    }

    /**
     * Calculate chart dimensions
     * @returns {Object|null} - Object with chart dimensions or null if chart is too small
     */
    calculateDimensions() {
        const svgWidth = this.svgElement.clientWidth || 500;
        const svgHeight = parseInt(this.svgElement.getAttribute('height')) || 380;
        const margin = { top: 40, right: 30, bottom: 120, left: 70 }; // Adjusted bottom margin for labels
        const chartWidth = svgWidth - margin.left - margin.right;
        const chartHeight = svgHeight - margin.top - margin.bottom;

        if (chartWidth <= 0 || chartHeight <= 0) {
            return null;
        }

        return { svgWidth, svgHeight, margin, chartWidth, chartHeight };
    }

    /**
     * Render empty state message
     * @param {string} message - Message to display
     */
    renderEmptyState(message) {
        this.svgElement.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#A0AEC0" font-size="14px">${message}</text>`;
    }

    /**
     * Render X-axis labels
     * @param {Array} projects - Array of [projectName, xpAmount] pairs
     * @param {number} barWidth - Width of each bar
     * @param {number} barPadding - Padding between bars
     * @param {number} chartWidth - Width of the chart area
     * @param {Object} margin - Chart margins
     * @param {number} svgHeight - Height of the SVG element
     */
    renderXAxisLabels(projects, barWidth, barPadding, chartWidth, margin, svgHeight) {
        projects.forEach((project, i) => {
            const x = margin.left + i * (chartWidth / projects.length) + (chartWidth / projects.length * barPadding / 2) + barWidth / 2; // Center of the bar group
            const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textEl.setAttribute("x", x);
            textEl.setAttribute("y", svgHeight - margin.bottom + 25); // Position below axis
            textEl.setAttribute("text-anchor", "end");
            textEl.setAttribute("transform", `rotate(-55 ${x} ${svgHeight - margin.bottom + 25})`);
            textEl.setAttribute("font-size", "10px");
            textEl.setAttribute("fill", "#CBD5E0");
            let projectNameText = project[0];
            if (projectNameText.length > 15) projectNameText = projectNameText.substring(0, 12) + "...";
            textEl.textContent = projectNameText;
            this.svgElement.appendChild(textEl);
        });
    }

    /**
     * Render Y-axis with grid lines
     * @param {number} maxValue - Maximum value for the Y-axis
     * @param {number} chartWidth - Width of the chart area
     * @param {number} chartHeight - Height of the chart area
     * @param {Object} margin - Chart margins
     */
    renderYAxis(maxValue, chartWidth, chartHeight, margin) {
        const yAxisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        yAxisGroup.setAttribute("transform", `translate(${margin.left}, ${margin.top})`);
        this.svgElement.appendChild(yAxisGroup);

        const numTicks = 5; // Number of ticks/gridlines
        for (let i = 0; i <= numTicks; i++) {
            const val = Math.round((maxValue / numTicks) * i);
            const yPos = chartHeight - (val / (maxValue || 1)) * chartHeight;
            
            // Grid line
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", 0); line.setAttribute("y1", yPos);
            line.setAttribute("x2", chartWidth); line.setAttribute("y2", yPos);
            line.setAttribute("stroke", "#4A5568"); // Tailwind gray-700
            line.setAttribute("stroke-dasharray", "3,3");
            yAxisGroup.appendChild(line);
            
            // Tick label
            const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textEl.setAttribute("x", -12); textEl.setAttribute("y", yPos + 4);
            textEl.setAttribute("text-anchor", "end"); textEl.setAttribute("font-size", "11px");
            textEl.setAttribute("fill", "#A0AEC0"); // Tailwind gray-400
            textEl.textContent = val.toLocaleString();
            yAxisGroup.appendChild(textEl);
        }
        
        // Y-axis title
        const yAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
        yAxisTitle.setAttribute("transform", "rotate(-90)");
        yAxisTitle.setAttribute("y", margin.left / 2 - 35 ); // Adjust position
        yAxisTitle.setAttribute("x", -(margin.top + chartHeight / 2));
        yAxisTitle.setAttribute("text-anchor", "middle"); yAxisTitle.setAttribute("font-size", "13px");
        yAxisTitle.setAttribute("font-weight", "500"); yAxisTitle.setAttribute("fill", "#E2E8F0"); // Tailwind gray-200
        yAxisTitle.textContent = "XP Amount";
        this.svgElement.appendChild(yAxisTitle);
    }

    /**
     * Render bars for the chart
     * @param {Array} projects - Array of [projectName, xpAmount] pairs
     * @param {number} barWidth - Width of each bar
     * @param {number} barPadding - Padding between bars
     * @param {number} chartWidth - Width of the chart area
     * @param {number} chartHeight - Height of the chart area
     * @param {Object} margin - Chart margins
     * @param {Function} scaleY - Function to scale Y values
     */
    renderBars(projects, barWidth, barPadding, chartWidth, chartHeight, margin, scaleY) {
        projects.forEach((project, i) => {
            const x = margin.left + i * (chartWidth / projects.length) + (chartWidth / projects.length * barPadding / 2);
            const y = margin.top + scaleY(project[1]);
            const h = chartHeight - scaleY(project[1]);
            const w = barWidth;

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", x); rect.setAttribute("y", y);
            rect.setAttribute("width", Math.max(0, w)); rect.setAttribute("height", Math.max(0, h)); // Ensure non-negative
            rect.setAttribute("fill", "url(#barGradient)");
            rect.setAttribute("rx", "3"); rect.setAttribute("ry", "3"); // Rounded corners
            rect.classList.add("chart-bar");

            // Tooltip
            const titleEl = document.createElementNS("http://www.w3.org/2000/svg", "title");
            titleEl.textContent = `${project[0]}: ${project[1].toLocaleString()} XP`;
            rect.appendChild(titleEl);
            this.svgElement.appendChild(rect);

            // Value text on top of bar (if space permits)
            if (h > 15) { // Only show if bar is tall enough
                const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                valueText.setAttribute("x", x + w / 2); valueText.setAttribute("y", y - 7); // Position above bar
                valueText.setAttribute("text-anchor", "middle"); valueText.setAttribute("font-size", "10px");
                valueText.setAttribute("font-weight", "600"); valueText.setAttribute("fill", "#C3DAFE"); // Lighter purple/blue
                valueText.textContent = project[1].toLocaleString();
                this.svgElement.appendChild(valueText);
            }
        });
    }

    /**
     * Define gradient for bars
     */
    defineGradient() {
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const linearGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        linearGradient.setAttribute("id", "barGradient");
        linearGradient.setAttribute("x1", "0%"); linearGradient.setAttribute("y1", "0%");
        linearGradient.setAttribute("x2", "0%"); linearGradient.setAttribute("y2", "100%");
        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("style", "stop-color:#A78BFA;stop-opacity:1"); // Tailwind purple-400
        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("style", "stop-color:#7C3AED;stop-opacity:1"); // Tailwind purple-600
        linearGradient.appendChild(stop1);
        linearGradient.appendChild(stop2);
        defs.appendChild(linearGradient);
        this.svgElement.appendChild(defs);
    }
}