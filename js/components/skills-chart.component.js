/**
 * Skills Chart Component
 * Renders a bar chart showing skill levels
 */
export class SkillsChartComponent {
    /**
     * Constructor
     * @param {HTMLElement} svgElement - The SVG element to render the chart in
     */
    constructor(svgElement) {
        this.svgElement = svgElement;
    }

    /**
     * Render the skills chart
     * @param {Array} skillsData - Array of skill objects with type and amount
     */
    render(skillsData) {
        if (!this.svgElement) return;
        
        // Ensure skillsData is an array and has items
        if (!Array.isArray(skillsData) || skillsData.length === 0) {
            this.renderEmptyState("No skills data available.");
            return;
        }

        // Process data
        const aggregatedSkills = this.processData(skillsData);
        
        if (aggregatedSkills.length === 0) {
            this.renderEmptyState("No skill data to display.");
            return;
        }

        this.svgElement.innerHTML = ''; // Clear previous chart content

        // Get dimensions
        const dimensions = this.calculateDimensions();
        if (!dimensions) {
            this.renderEmptyState("Chart cannot be rendered (too small).");
            return;
        }

        const { svgWidth, svgHeight, margin, chartWidth, chartHeight } = dimensions;

        // Calculate scales
        const maxAmount = Math.max(...aggregatedSkills.map(s => s.amount), 0);
        if (maxAmount === 0) {
            this.renderEmptyState("All skills have 0% progress.");
            return;
        }

        const barPadding = 0.3; // Relative padding
        const barWidth = chartWidth / aggregatedSkills.length * (1 - barPadding);
        const scaleY = val => (val / (maxAmount || 1)) * chartHeight; // Scale value to bar height, prevent division by zero

        // Create chart group
        const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        chartGroup.setAttribute("transform", `translate(${margin.left}, ${margin.top})`);
        this.svgElement.appendChild(chartGroup);

        // Render bars and labels
        this.renderBarsAndLabels(aggregatedSkills, barWidth, barPadding, chartWidth, chartHeight, scaleY, chartGroup);
        
        // Render Y-axis with grid lines
        this.renderYAxis(maxAmount, chartWidth, chartHeight, chartGroup);
        
        // Define gradient for bars
        this.defineGradient();
    }

    /**
     * Process raw skills data
     * @param {Array} skillsData - Array of skill objects
     * @returns {Array} - Processed skills data
     */
    processData(skillsData) {
        // Aggregate skills: take the max amount for each skill type if duplicates exist
        const skillsMap = {};
        skillsData.forEach(skill => {
            const skillType = skill.type.replace(/^skill_/, ''); // Normalize skill type name
            if (!skillsMap[skillType] || skillsMap[skillType] < skill.amount) {
                skillsMap[skillType] = skill.amount;
            }
        });

        return Object.entries(skillsMap)
            .map(([type, amount]) => ({ type: `skill_${type}`, amount })) // Reconstruct skill object
            .sort((a, b) => b.amount - a.amount) // Sort by amount desc
            .slice(0, 10); // Take top 10 skills
    }

    /**
     * Calculate chart dimensions
     * @returns {Object|null} - Object with chart dimensions or null if chart is too small
     */
    calculateDimensions() {
        const svgWidth = this.svgElement.clientWidth || 500;
        const svgHeight = parseInt(this.svgElement.getAttribute('height')) || 400;
        const margin = { top: 40, right: 30, bottom: 100, left: 70 }; // Adjusted margins
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
     * Render bars and labels
     * @param {Array} skills - Array of skill objects
     * @param {number} barWidth - Width of each bar
     * @param {number} barPadding - Padding between bars
     * @param {number} chartWidth - Width of the chart area
     * @param {number} chartHeight - Height of the chart area
     * @param {Function} scaleY - Function to scale Y values
     * @param {SVGElement} chartGroup - Chart group element
     */
    renderBarsAndLabels(skills, barWidth, barPadding, chartWidth, chartHeight, scaleY, chartGroup) {
        skills.forEach((skill, i) => {
            const x = i * (chartWidth / skills.length) + (chartWidth / skills.length * barPadding / 2); // Start of bar group
            const barHeight = scaleY(skill.amount);
            const y = chartHeight - barHeight; // Y position for top of the bar

            // X-axis label (skill name)
            const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textEl.setAttribute("x", x + barWidth / 2); // Center of the bar
            textEl.setAttribute("y", chartHeight + 25); // Position below x-axis line
            textEl.setAttribute("text-anchor", "end"); // Anchor to end for rotation
            textEl.setAttribute("transform", `rotate(-45 ${x + barWidth/2} ${chartHeight + 25})`);
            textEl.setAttribute("font-size", "11px");
            textEl.setAttribute("fill", "#CBD5E0"); // Tailwind gray-300
            
            // Format skill name: remove "skill_", replace underscores, capitalize
            let skillName = skill.type.replace(/^skill_/, '').replace(/_/g, ' ').replace(/-/g, ' ');
            skillName = skillName.split(' ').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            if (skillName.length > 12) skillName = skillName.substring(0, 9) + "..."; // Truncate long names
            textEl.textContent = skillName;
            chartGroup.appendChild(textEl);

            // Create bar
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", x);
            rect.setAttribute("y", y);
            rect.setAttribute("width", Math.max(0, barWidth)); // Ensure non-negative
            rect.setAttribute("height", Math.max(0, barHeight)); // Ensure non-negative
            rect.setAttribute("fill", "url(#skillBarGradient)");
            rect.setAttribute("rx", "3"); // Rounded corners
            rect.setAttribute("ry", "3");
            rect.classList.add("chart-bar");

            // Tooltip
            const titleEl = document.createElementNS("http://www.w3.org/2000/svg", "title");
            titleEl.textContent = `${skillName}: ${skill.amount}%`;
            rect.appendChild(titleEl);
            chartGroup.appendChild(rect);

            // Value text on top of bar
            if (barHeight > 15) {
                const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                valueText.setAttribute("x", x + barWidth / 2);
                valueText.setAttribute("y", y - 5); // Position above the bar
                valueText.setAttribute("text-anchor", "middle");
                valueText.setAttribute("font-size", "10px");
                valueText.setAttribute("font-weight", "600");
                valueText.setAttribute("fill", "#C3DAFE"); // Light pink/purple
                valueText.textContent = skill.amount + "%";
                chartGroup.appendChild(valueText);
            }
        });
    }

    /**
     * Render Y-axis with grid lines
     * @param {number} maxValue - Maximum value for the Y-axis
     * @param {number} chartWidth - Width of the chart area
     * @param {number} chartHeight - Height of the chart area
     * @param {SVGElement} chartGroup - Chart group element
     */
    renderYAxis(maxValue, chartWidth, chartHeight, chartGroup) {
        const yAxisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        chartGroup.appendChild(yAxisGroup);

        const numYTicks = 5; // Number of ticks on Y-axis
        for (let i = 0; i <= numYTicks; i++) {
            const val = Math.round((maxValue / numYTicks) * i);
            const yPos = chartHeight - (val / (maxValue || 1)) * chartHeight; // Y position for the tick

            // Grid line
            const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            gridLine.setAttribute("x1", 0);
            gridLine.setAttribute("y1", yPos);
            gridLine.setAttribute("x2", chartWidth);
            gridLine.setAttribute("y2", yPos);
            gridLine.setAttribute("stroke", "#4A5568"); // Tailwind gray-700
            gridLine.setAttribute("stroke-dasharray", "2,2");
            yAxisGroup.appendChild(gridLine);

            // Tick label
            const tickText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            tickText.setAttribute("x", -10);
            tickText.setAttribute("y", yPos + 4); // Adjust for vertical alignment
            tickText.setAttribute("text-anchor", "end");
            tickText.setAttribute("font-size", "10px");
            tickText.setAttribute("fill", "#A0AEC0"); // Tailwind gray-400
            tickText.textContent = val + "%";
            yAxisGroup.appendChild(tickText);
        }

        // Y-axis Title
        const yAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
        yAxisTitle.setAttribute("transform", "rotate(-90)");
        yAxisTitle.setAttribute("x", -(chartHeight / 2));
        yAxisTitle.setAttribute("y", -50); // Position to the left of Y-axis
        yAxisTitle.setAttribute("text-anchor", "middle");
        yAxisTitle.setAttribute("font-size", "12px");
        yAxisTitle.setAttribute("font-weight", "600");
        yAxisTitle.setAttribute("fill", "#E2E8F0"); // Tailwind gray-200
        yAxisTitle.textContent = "Skill Level (%)";
        chartGroup.appendChild(yAxisTitle);
    }

    /**
     * Define gradient for bars
     */
    defineGradient() {
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const skillGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        skillGradient.setAttribute("id", "skillBarGradient");
        skillGradient.setAttribute("x1", "0%");
        skillGradient.setAttribute("y1", "0%");
        skillGradient.setAttribute("x2", "0%");
        skillGradient.setAttribute("y2", "100%");

        const stopS1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stopS1.setAttribute("offset", "0%");
        stopS1.setAttribute("style", "stop-color:#F472B6;stop-opacity:1"); // Tailwind pink-400

        const stopS2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stopS2.setAttribute("offset", "100%");
        stopS2.setAttribute("style", "stop-color:#EC4899;stop-opacity:1"); // Tailwind pink-500

        skillGradient.appendChild(stopS1);
        skillGradient.appendChild(stopS2);
        defs.appendChild(skillGradient);
        this.svgElement.appendChild(defs); // Append defs to the main SVG element
    }
}