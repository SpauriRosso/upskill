/**
 * Main Application Class
 * Coordinates the application components and handles the main flow
 */
import { apiService } from './services/api.service.js';
import { userDataModel } from './models/user-data.model.js';
import { XpChartComponent } from './components/xp-chart.component.js';
import { SkillsChartComponent } from './components/skills-chart.component.js';
import { 
    getById, 
    showElement, 
    hideElement, 
    setText, 
    formatXp, 
    addEvent, 
    debounce,
    getProjectNameFromPath
} from './utils/dom.utils.js';

export class App {
    constructor() {
        // Initialize components
        this.xpChartComponent = new XpChartComponent(getById('xpByProjectChart'));
        this.skillsChartComponent = new SkillsChartComponent(getById('skillsChart'));
        
        // Store last fetched data for efficient chart resizing
        this.lastFetchedDataForResize = null;
        
        // Check if user is already authenticated
        const token = localStorage.getItem('jwtToken');
        if (token) {
            apiService.setToken(token);
        }
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        
        if (apiService.getToken()) {
            this.showProfile();
        } else {
            this.showLogin();
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Login form submission
        addEvent('loginForm', 'submit', this.handleLogin, this);
        
        // Logout button click
        addEvent('logoutButton', 'click', this.handleLogout, this);
        
        // Window resize event for charts
        const handleResize = debounce(() => {
            if (getById('profilePage').style.display !== 'none' && this.lastFetchedDataForResize) {
                this.generateCharts(true);
            }
        }, 250);
        
        window.addEventListener('resize', handleResize);
    }

    /**
     * Show the login page
     */
    showLogin() {
        showElement('loginPage');
        hideElement('profilePage');
    }

    /**
     * Show the profile page and load data
     */
    showProfile() {
        hideElement('loginPage');
        showElement('profilePage');
        showElement('loadingSpinner');
        hideElement('mainContent');
        
        this.loadProfileData();
    }

    /**
     * Handle login form submission
     * @param {Event} e - Form submit event
     */
    async handleLogin(e) {
        e.preventDefault();

        const loginButton = getById('loginButton');
        const loginError = getById('loginError');
        const loginInput = getById('loginInput').value;
        const password = getById('passwordInput').value;

        loginButton.textContent = 'Signing in...';
        loginButton.disabled = true;
        hideElement(loginError);

        try {
            const token = await apiService.authenticate(loginInput, password);
            apiService.setToken(token);
            localStorage.setItem('jwtToken', token);
            this.showProfile();
        } catch (error) {
            loginError.textContent = error.message || 'Invalid username/email or password. Please try again.';
            showElement(loginError);
        } finally {
            loginButton.textContent = 'Sign In';
            loginButton.disabled = false;
        }
    }

    /**
     * Handle logout button click
     */
    handleLogout() {
        localStorage.removeItem('jwtToken');
        apiService.setToken(null);
        userDataModel.reset();
        this.lastFetchedDataForResize = null;
        this.showLogin();
        getById('loginForm').reset();
    }

    /**
     * Load profile data from the API
     */
    async loadProfileData() {
        try {
            await userDataModel.loadAllData();
            
            // Store data for chart resizing
            this.lastFetchedDataForResize = userDataModel.getAllData();
            
            this.displayUserInfo();
            this.calculateStats();
            this.generateCharts();
            
            hideElement('loadingSpinner');
            showElement('mainContent');
        } catch (error) {
            console.error('Error loading profile data:', error);
            const mainContent = getById('mainContent');
            mainContent.innerHTML = `<div class="text-center text-red-400 p-4 bg-red-900/30 rounded-lg">${error.message}. Try logging out and in.</div>`;
            showElement(mainContent);
            hideElement('loadingSpinner');
            
            if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
                this.handleLogout();
            }
        }
    }

    /**
     * Display user information
     */
    displayUserInfo() {
        const user = userDataModel.getUserInfo();
        setText('userId', user.id || 'N/A');
        setText('userLogin', user.login || 'N/A');
    }

    /**
     * Calculate and display statistics
     */
    calculateStats() {
        // Display total XP
        const totalXP = userDataModel.getTotalXp();
        setText('totalXP', formatXp(totalXP));
        
        // Display audit ratio and counts
        const auditRatio = userDataModel.getAuditRatio();
        setText('auditRatioDisplay', parseFloat(auditRatio).toFixed(1));
        setText('auditsDoneCount', userDataModel.getAuditsDoneCount());
        setText('auditsReceivedCount', userDataModel.getAuditsReceivedCount());
        
        // Display piscine stats
        this.displayPiscineStats();
        
        // Display piscine details
        this.displayPiscineDetails();
        
        // Display collaborators
        this.displayCollaborators();
        
        // Display activity data
        this.displayActivity();
        
        // Populate projects table
        this.populateProjectsTable();
        
        // Add glow effect to elements
        this.addGlowEffect();
    }
    
    /**
     * Display piscine statistics
     */
    displayPiscineStats() {
        const piscineStats = userDataModel.getPiscineStats();
        setText('piscineGoXp', formatXp(piscineStats.piscineGo));
        setText('piscineJsXp', formatXp(piscineStats.piscineJs));
        setText('cursusXp', formatXp(piscineStats.cursus));
    }
    
    /**
     * Display detailed piscine data
     */
    displayPiscineDetails() {
        const piscineDetails = userDataModel.getPiscineDetails();
        
        // Piscine Go
        const piscineGoTotal = piscineDetails.piscineGo.total;
        const piscineGoDetails = piscineDetails.piscineGo.details;
        const piscineGoProgress = Math.min(100, Math.round((piscineGoTotal / 1000000) * 100)); // Assuming 1M XP is 100%
        
        setText('piscineGoProgress', `${piscineGoProgress}%`);
        getById('piscineGoProgressBar').style.width = `${piscineGoProgress}%`;
        
        // Display recent piscine Go details
        const piscineGoDetailsHtml = piscineGoDetails
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
            .map(detail => {
                const date = new Date(detail.createdAt).toLocaleDateString();
                const path = getProjectNameFromPath(detail.path);
                return `<div class="mb-1"><span class="text-purple-300">${formatXp(detail.amount)}</span> - ${path} (${date})</div>`;
            })
            .join('') || '<div>No piscine Go data available</div>';
            
        getById('piscineGoDetails').innerHTML = piscineGoDetailsHtml;
        
        // Piscine JS
        const piscineJsTotal = piscineDetails.piscineJs.total;
        const piscineJsDetails = piscineDetails.piscineJs.details;
        const piscineJsProgress = Math.min(100, Math.round((piscineJsTotal / 1000000) * 100)); // Assuming 1M XP is 100%
        
        setText('piscineJsProgress', `${piscineJsProgress}%`);
        getById('piscineJsProgressBar').style.width = `${piscineJsProgress}%`;
        
        // Display recent piscine JS details
        const piscineJsDetailsHtml = piscineJsDetails
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
            .map(detail => {
                const date = new Date(detail.createdAt).toLocaleDateString();
                const path = getProjectNameFromPath(detail.path);
                return `<div class="mb-1"><span class="text-purple-300">${formatXp(detail.amount)}</span> - ${path} (${date})</div>`;
            })
            .join('') || '<div>No piscine JS data available</div>';
            
        getById('piscineJsDetails').innerHTML = piscineJsDetailsHtml;
    }
    
    /**
     * Display collaborators data
     */
    displayCollaborators() {
        const collaborators = userDataModel.getCollaborators();
        const collaboratorsContainer = getById('collaboratorsList');
        
        if (collaborators.length === 0) {
            collaboratorsContainer.innerHTML = '<div class="text-center text-gray-400 col-span-full">No collaborators found</div>';
            return;
        }
        
        const collaboratorsHtml = collaborators
            .slice(0, 8) // Show top 8 collaborators
            .map(collaborator => {
                return `
                    <div class="glass-card p-4 text-center fade-in">
                        <div class="text-xl font-semibold text-white mb-2">${collaborator.login}</div>
                        <div class="text-purple-300">${collaborator.count} project${collaborator.count !== 1 ? 's' : ''}</div>
                    </div>
                `;
            })
            .join('');
            
        collaboratorsContainer.innerHTML = collaboratorsHtml;
    }
    
    /**
     * Display activity data
     */
    displayActivity() {
        const activity = userDataModel.getActivity();
        const activityContainer = getById('activityHeatmap');
        
        if (activity.length === 0) {
            activityContainer.innerHTML = '<div class="flex justify-center items-center h-32 text-gray-400">No activity data available</div>';
            return;
        }
        
        // Find the maximum activity count to normalize colors
        const maxCount = Math.max(...activity.map(a => a.count));
        
        // Get dates for the last 6 months
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        
        // Create a map of date to count
        const activityMap = {};
        activity.forEach(a => {
            activityMap[a.date] = a.count;
        });
        
        // Generate cells for each day in the last 6 months
        let currentDate = new Date(sixMonthsAgo);
        const cells = [];
        
        while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const count = activityMap[dateStr] || 0;
            const intensity = maxCount > 0 ? count / maxCount : 0;
            
            // Calculate color based on intensity (purple to pink gradient)
            const r = Math.round(138 + (intensity * (236 - 138)));
            const g = Math.round(58 + (intensity * (72 - 58)));
            const b = Math.round(180 + (intensity * (153 - 180)));
            
            cells.push(`
                <div 
                    class="activity-cell" 
                    style="background-color: rgba(${r}, ${g}, ${b}, ${0.1 + intensity * 0.9})" 
                    title="${dateStr}: ${count} activities"
                ></div>
            `);
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        activityContainer.innerHTML = cells.join('');
    }
    
    /**
     * Add glow effect to elements with the glow-effect class
     */
    addGlowEffect() {
        const glowElements = document.querySelectorAll('.glow-effect');
        
        glowElements.forEach(element => {
            element.addEventListener('mousemove', e => {
                const rect = element.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                element.style.setProperty('--x', `${x}%`);
                element.style.setProperty('--y', `${y}%`);
            });
        });
    }

    /**
     * Populate the projects table with recent XP transactions
     */
    populateProjectsTable() {
        const tableBody = getById('projectsTable');
        
        const recentXPTransactions = userDataModel.getTransactions()
            .filter(t => (!t.type || t.type === 'xp') && typeof t.amount === 'number')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
            
        if (recentXPTransactions.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" class="py-3 px-4 text-center text-gray-400">No XP transactions found.</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = recentXPTransactions.map(transaction => {
            const date = new Date(transaction.createdAt).toLocaleDateString();
            const taskName = getProjectNameFromPath(transaction.path) || (transaction.object ? transaction.object.name : 'Unknown Task');
            
            return `
                <tr class="hover:bg-white/5 transition-colors">
                    <td class="py-3 px-4 text-white">${taskName}</td>
                    <td class="py-3 px-4 text-purple-300">${(transaction.amount || 0).toLocaleString()}</td>
                    <td class="py-3 px-4 text-gray-300">${date}</td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Generate charts
     * @param {boolean} isResize - Whether this is a resize event
     */
    generateCharts(isResize = false) {
        const dataToUse = isResize && this.lastFetchedDataForResize 
            ? this.lastFetchedDataForResize 
            : userDataModel.getAllData();
            
        if (dataToUse) {
            this.xpChartComponent.render(dataToUse.transactions || []);
            this.skillsChartComponent.render(dataToUse.skills || []);
        }
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});