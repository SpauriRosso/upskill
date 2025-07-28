/**
 * User Data Model
 * Manages the application's data state
 */
import { apiService } from '../services/api.service.js';

export class UserDataModel {
    constructor() {
        // Initialize user data structure
        this.reset();
    }

    /**
     * Reset the user data to its initial state
     */
    reset() {
        this.data = {
            user: null, // Will store { id, login, auditRatio }
            transactions: [], // For XP transactions list (e.g., for the table)
            skills: [],
            progress: [],
            audits: [], // Original audits query (audits received on projects)
            auditsDoneCount: 0, // Count of audits performed by the user
            auditsReceivedCount: 0, // Count of audits received by the user (from transactions 'down')
            totalXpAmount: 0, // Stores the sum of all XP transactions
            
            // New data properties
            piscineStats: {
                piscineGo: 0,
                piscineJs: 0,
                cursus: 0
            },
            piscineDetails: {
                piscineGo: { total: 0, details: [] },
                piscineJs: { total: 0, details: [] },
                cursus: { total: 0, details: [] }
            },
            collaborators: [], // Users you've worked with
            activity: [] // GitHub-like activity data
        };
    }

    /**
     * Load all user data from the API
     * @returns {Promise<void>}
     */
    async loadAllData() {
        try {
            await this.loadUserInfo();
            await this.loadTransactions();
            await this.loadProgress();
            await this.loadAudits();
            
            // Load new data
            await this.loadPiscineStats();
            await this.loadPiscineDetails();
            await this.loadCollaborators();
            await this.loadActivity();
        } catch (error) {
            console.error('Error loading user data:', error);
            throw error;
        }
    }
    
    /**
     * Load piscine statistics
     * @returns {Promise<void>}
     */
    async loadPiscineStats() {
        try {
            this.data.piscineStats = await apiService.fetchPiscineStats();
        } catch (error) {
            console.error('Error loading piscine stats:', error);
            // Don't throw, just log the error to avoid breaking the entire app
        }
    }
    
    /**
     * Load detailed piscine data
     * @returns {Promise<void>}
     */
    async loadPiscineDetails() {
        try {
            this.data.piscineDetails = await apiService.fetchPiscineXpWithDetails();
        } catch (error) {
            console.error('Error loading piscine details:', error);
            // Don't throw, just log the error to avoid breaking the entire app
        }
    }
    
    /**
     * Load collaborators data
     * @returns {Promise<void>}
     */
    async loadCollaborators() {
        try {
            this.data.collaborators = await apiService.fetchBestFriends();
        } catch (error) {
            console.error('Error loading collaborators:', error);
            // Don't throw, just log the error to avoid breaking the entire app
        }
    }
    
    /**
     * Load activity data
     * @returns {Promise<void>}
     */
    async loadActivity() {
        try {
            this.data.activity = await apiService.fetchGithubLikeActivity();
        } catch (error) {
            console.error('Error loading activity data:', error);
            // Don't throw, just log the error to avoid breaking the entire app
        }
    }

    /**
     * Load user information
     * @returns {Promise<void>}
     */
    async loadUserInfo() {
        this.data.user = await apiService.fetchUserInfo();
        if (this.data.user && typeof this.data.user.auditRatio === 'undefined') {
            this.data.user.auditRatio = 0;
        }
    }

    /**
     * Load transactions, skills, and audit counts
     * @returns {Promise<void>}
     */
    async loadTransactions() {
        const data = await apiService.fetchTransactions();
        this.data.transactions = data.transaction || [];
        this.data.skills = data.skills || [];
        this.data.auditsDoneCount = data.auditsDoneCount?.aggregate?.count || 0;
        this.data.auditsReceivedCount = data.auditsReceivedCount?.aggregate?.count || 0;
        this.data.totalXpAmount = data.totalXpSum?.aggregate?.sum?.amount || 0;
    }

    /**
     * Load progress data
     * @returns {Promise<void>}
     */
    async loadProgress() {
        this.data.progress = await apiService.fetchProgress();
    }

    /**
     * Load audit data
     * @returns {Promise<void>}
     */
    async loadAudits() {
        this.data.audits = await apiService.fetchAudits();
    }

    /**
     * Get user basic information
     * @returns {Object} - User information
     */
    getUserInfo() {
        return this.data.user;
    }

    /**
     * Get transactions data
     * @returns {Array} - Transactions data
     */
    getTransactions() {
        return this.data.transactions;
    }

    /**
     * Get skills data
     * @returns {Array} - Skills data
     */
    getSkills() {
        return this.data.skills;
    }

    /**
     * Get progress data
     * @returns {Array} - Progress data
     */
    getProgress() {
        return this.data.progress;
    }

    /**
     * Get audits data
     * @returns {Array} - Audits data
     */
    getAudits() {
        return this.data.audits;
    }

    /**
     * Get total XP amount
     * @returns {number} - Total XP
     */
    getTotalXp() {
        return this.data.totalXpAmount;
    }

    /**
     * Get audit ratio
     * @returns {number} - Audit ratio
     */
    getAuditRatio() {
        return this.data.user?.auditRatio || 0;
    }

    /**
     * Get a copy of all data (for chart resizing, etc.)
     * @returns {Object} - Copy of all data
     */
    getAllData() {
        return { ...this.data };
    }
    
    /**
     * Get piscine statistics
     * @returns {Object} - Piscine statistics
     */
    getPiscineStats() {
        return this.data.piscineStats;
    }
    
    /**
     * Get detailed piscine data
     * @returns {Object} - Detailed piscine data
     */
    getPiscineDetails() {
        return this.data.piscineDetails;
    }
    
    /**
     * Get collaborators data
     * @returns {Array} - Collaborators data
     */
    getCollaborators() {
        return this.data.collaborators;
    }
    
    /**
     * Get activity data
     * @returns {Array} - Activity data
     */
    getActivity() {
        return this.data.activity;
    }
    
    /**
     * Get audits done count
     * @returns {number} - Audits done count
     */
    getAuditsDoneCount() {
        return this.data.auditsDoneCount;
    }
    
    /**
     * Get audits received count
     * @returns {number} - Audits received count
     */
    getAuditsReceivedCount() {
        return this.data.auditsReceivedCount;
    }
}

// Export as a singleton
export const userDataModel = new UserDataModel();