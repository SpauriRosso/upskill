/**
 * API Service for handling GraphQL queries and API communication
 */
class ApiService {
    constructor() {
        this.apiUrl = 'https://zone01normandie.org/api/graphql-engine/v1/graphql';
        this.authUrl = 'https://zone01normandie.org/api/auth/signin';
        
        // GraphQL queries from schema
        this.queries = {
            getAllXPGains: `
                query GetUserDetailedXp {
                    transaction(
                        where: {
                        type: {_eq: "xp"},
                        path: {_niregex: "/(piscine-[^/]+/)"}
                        },
                        order_by: {createdAt: desc}
                    ) {
                        id
                        type
                        amount
                        createdAt
                        path
                        objectId
                    }
                }
            `,
            getPiscineStats: `
                query GetXpStats {
                piscineGoXp: transaction_aggregate(where: {
                    type: { _eq: "xp" },
                    path: { _like: "%piscine-go%" }
                }) {
                    aggregate {
                        sum {
                            amount
                        }
                    }
                }

                piscineJsXp: transaction_aggregate(where: {
                    type: { _eq: "xp" },
                    path: { _like: "%piscine-js/%" }
                }) {
                    aggregate {
                        sum {
                            amount
                        }
                    }
                }

                cursusXp: transaction_aggregate(where: {
                    type: { _eq: "xp" },
                    _or: [
                    {
                        path: { _like: "%div-01%" },
                        _not: { path: { _like: "%piscine%" } }
                    },
                    {
                        path: { _like: "%div-01/piscine-js" },
                        _not: { path: { _like: "%piscine-js/%" } }
                    }
                    ]
                }) {
                    aggregate {
                        sum {
                            amount
                        }
                    }
                }
                }
            `,
            getPiscineXpWithDetails: `
                query GetXpStatsWithDetails {
                # Piscine Go - Aggregate
                piscineGoXpAggregate: transaction_aggregate(
                    where: {
                    type: { _eq: "xp" },
                    path: { _like: "%piscine-go%" }
                    }
                ) {
                    aggregate {
                        sum {
                            amount
                        }
                    }
                }

                # Piscine Go - Detailed transactions
                piscineGoXpDetails: transaction(
                    where: {
                    type: { _eq: "xp" },
                    path: { _like: "%piscine-go%" }
                    },
                    order_by: { createdAt: asc }
                ) {
                    amount
                    createdAt
                    path
                }

                # Piscine JS - Aggregate
                piscineJsXpAggregate: transaction_aggregate(
                    where: {
                    type: { _eq: "xp" },
                    path: { _like: "%piscine-js/%" }
                    }
                ) {
                    aggregate {
                        sum {
                            amount
                        }
                    }
                }

                # Piscine JS - Detailed transactions
                piscineJsXpDetails: transaction(
                    where: {
                    type: { _eq: "xp" },
                    path: { _like: "%piscine-js/%" }
                    },
                    order_by: { createdAt: asc }
                ) {
                    amount
                    createdAt
                    path
                }

                # Cursus - Aggregate
                cursusXpAggregate: transaction_aggregate(
                    where: {
                    type: { _eq: "xp" },
                    _or: [
                        {
                        path: { _like: "%div-01%" },
                        _not: { path: { _like: "%piscine%" } }
                        },
                        {
                        path: { _like: "%div-01/piscine-js" },
                        _not: { path: { _like: "%piscine-js/%" } }
                        }
                    ]
                    }
                ) {
                    aggregate {
                        sum {
                            amount
                        }
                    }
                }

                # Cursus - Detailed transactions
                cursusXpDetails: transaction(
                    where: {
                    type: { _eq: "xp" },
                    _or: [
                        {
                        path: { _like: "%div-01%" },
                        _not: { path: { _like: "%piscine%" } }
                        },
                        {
                        path: { _like: "%div-01/piscine-js" },
                        _not: { path: { _like: "%piscine-js/%" } }
                        }
                    ]
                    },
                    order_by: { createdAt: asc }
                ) {
                    amount
                    createdAt
                    path
                }
                }
            `,
            getSkillsAmounts: `
                query GetSkills {
                    user {
                        transactions(
                        where: {
                            _and: [
                            { type: { _neq: "xp" } },
                            { type: { _neq: "level" } }
                            { type: { _neq: "up" } }
                            { type: { _neq: "down" } }
                            ]
                        }
                        order_by: { createdAt: asc }
                        ) {
                            type
                            amount
                        }
                    }
                }
            `,
            getBestFriends: `
                query GetBestFriend {
                    user {
                        # Group participation
                        groups {
                            id
                            createdAt
                            group {
                                object {
                                    type
                                }
                                    captainId
                                    members {
                                    user {
                                        login
                                    }
                                }
                            }
                        }
                    }
                }
            `,
            getAllAudits: `
                query GetAudits {
                    user {
                        audits_as_auditor: audits(order_by: {createdAt: desc}) {
                            createdAt
                            grade
                            group {
                                object {
                                    name
                                    type
                                }
                                members {
                                    user {
                                        id
                                        login
                                    }
                                }
                            }
                        }
                    }
                }
            `,
            getGithubLikeActivity: `
                query GetActivity {
                    user {
                        progresses(
                            order_by: {createdAt: desc}
                        ) {
                            createdAt
                        }
                    }
                }
            `
        };
    }

    /**
     * Set the authentication token for API requests
     * @param {string} token - JWT token
     */
    setToken(token) {
        this.token = token;
    }

    /**
     * Get the current authentication token
     * @returns {string|null} - JWT token or null if not set
     */
    getToken() {
        return this.token;
    }

    /**
     * Make a GraphQL query to the API
     * @param {string} query - GraphQL query string
     * @param {Object} variables - Variables for the GraphQL query
     * @returns {Promise<Object>} - Query result data
     * @throws {Error} - If the query fails
     */
    async makeGraphQLQuery(query, variables = {}) {
        if (!this.token) {
            throw new Error("Authentication token not found. Please login.");
        }
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const parsedError = JSON.parse(errorBody);
                if (parsedError.errors && parsedError.errors.length > 0) {
                    errorMessage = parsedError.errors.map(e => e.message).join('; ');
                } else if (parsedError.message) {
                    errorMessage = parsedError.message;
                }
            } catch (e) {
                errorMessage = `HTTP error! status: ${response.status}. Response: ${errorBody.substring(0,100)}`;
            }
            if (response.status === 401 || response.status === 403) {
                errorMessage = `Unauthorized or Forbidden: ${errorMessage}. Your session might have expired.`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        if (data.errors) {
            throw new Error(data.errors.map(e => e.message).join('; '));
        }
        return data.data;
    }

    /**
     * Authenticate user with credentials
     * @param {string} login - User login or email
     * @param {string} password - User password
     * @returns {Promise<string>} - JWT token
     * @throws {Error} - If authentication fails
     */
    async authenticate(login, password) {
        const credentials = btoa(`${login}:${password}`);
        const response = await fetch(this.authUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const token = await response.text();
            return token.replace(/"/g, '');
        } else {
            const errorData = await response.json().catch(() => ({ message: "Invalid credentials or server error" }));
            throw new Error(errorData.message || 'Invalid credentials');
        }
    }

    /**
     * Fetch user information
     * @returns {Promise<Object>} - User data
     */
    async fetchUserInfo() {
        const query = `{
            user {
                id
                login
                auditRatio 
            }
        }`;
        const data = await this.makeGraphQLQuery(query);
        return data.user && data.user.length > 0
            ? data.user[0]
            : {id: 'N/A', login: 'N/A', auditRatio: 0};
    }

    /**
     * Fetch transactions, skills, audit counts, and total XP
     * @returns {Promise<Object>} - Transactions data
     */
    async fetchTransactions() {
        const query = `query CombinedTransactionsAndAudits {
            transaction(where: {type: {_eq: "xp"}}) {
                id
                amount
                createdAt
                path
                object {
                    name
                }
            }
            skills: transaction(where: {type: {_like: "skill_%"}}, order_by: {amount: desc}) {
                type
                amount
            }
            auditsDoneCount: transaction_aggregate(where: {type: {_eq: "up"}}) {
                aggregate {
                    count
                }
            }
            auditsReceivedCount: transaction_aggregate(where: {type: {_eq: "down"}}) {
                aggregate {
                    count
                }
            }
            totalXpSum: transaction_aggregate(where: { 
                _and: [
                    { type: {_eq: "xp"} }, 
                    { eventId: {_eq: 75} }
                ] 
            }) {
                aggregate {
                    sum {
                        amount
                    }
                }
            }
        }`;
        return await this.makeGraphQLQuery(query);
    }

    /**
     * Fetch progress data
     * @returns {Promise<Array>} - Progress data
     */
    async fetchProgress() {
        const query = `{
            progress {
                id
                grade 
                createdAt
                path
                object {
                    name
                    type
                }
            }
        }`;
        const data = await this.makeGraphQLQuery(query);
        return data.progress || [];
    }

    /**
     * Fetch audit data
     * @returns {Promise<Array>} - Audit data
     */
    async fetchAudits() {
        const query = `{
            audit {
                id
                grade
                createdAt
                updatedAt
                group {
                    object {
                        name
                        type
                    }
                }
            }
        }`;
        const data = await this.makeGraphQLQuery(query);
        return data.audit || [];
    }

    /**
     * Fetch all XP gains (excluding piscine XP)
     * @returns {Promise<Array>} - XP transactions
     */
    async fetchAllXPGains() {
        const data = await this.makeGraphQLQuery(this.queries.getAllXPGains);
        return data.transaction || [];
    }

    /**
     * Fetch piscine statistics
     * @returns {Promise<Object>} - Piscine XP statistics
     */
    async fetchPiscineStats() {
        const data = await this.makeGraphQLQuery(this.queries.getPiscineStats);
        return {
            piscineGo: data.piscineGoXp?.aggregate?.sum?.amount || 0,
            piscineJs: data.piscineJsXp?.aggregate?.sum?.amount || 0,
            cursus: data.cursusXp?.aggregate?.sum?.amount || 0
        };
    }

    /**
     * Fetch detailed piscine XP data
     * @returns {Promise<Object>} - Detailed piscine XP data
     */
    async fetchPiscineXpWithDetails() {
        const data = await this.makeGraphQLQuery(this.queries.getPiscineXpWithDetails);
        return {
            piscineGo: {
                total: data.piscineGoXpAggregate?.aggregate?.sum?.amount || 0,
                details: data.piscineGoXpDetails || []
            },
            piscineJs: {
                total: data.piscineJsXpAggregate?.aggregate?.sum?.amount || 0,
                details: data.piscineJsXpDetails || []
            },
            cursus: {
                total: data.cursusXpAggregate?.aggregate?.sum?.amount || 0,
                details: data.cursusXpDetails || []
            }
        };
    }

    /**
     * Fetch skills amounts
     * @returns {Promise<Array>} - Skills data
     */
    async fetchSkillsAmounts() {
        const data = await this.makeGraphQLQuery(this.queries.getSkillsAmounts);
        return data.user?.[0]?.transactions || [];
    }

    /**
     * Fetch collaborators data (users you've worked with)
     * @returns {Promise<Array>} - Collaborators data
     */
    async fetchBestFriends() {
        const data = await this.makeGraphQLQuery(this.queries.getBestFriends);
        
        // Process the data to get a list of unique collaborators with frequency
        const collaborators = {};
        const groups = data.user?.[0]?.groups || [];
        
        groups.forEach(groupEntry => {
            const members = groupEntry.group?.members || [];
            members.forEach(member => {
                const login = member.user?.login;
                if (login) {
                    collaborators[login] = (collaborators[login] || 0) + 1;
                }
            });
        });
        
        // Convert to array and sort by frequency
        return Object.entries(collaborators)
            .map(([login, count]) => ({ login, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Fetch all audits (as auditor)
     * @returns {Promise<Array>} - Audits data
     */
    async fetchAllAudits() {
        const data = await this.makeGraphQLQuery(this.queries.getAllAudits);
        return data.user?.[0]?.audits_as_auditor || [];
    }

    /**
     * Fetch activity data for GitHub-like activity chart
     * @returns {Promise<Array>} - Activity data
     */
    async fetchGithubLikeActivity() {
        const data = await this.makeGraphQLQuery(this.queries.getGithubLikeActivity);
        
        // Process the data to get activity counts by date
        const activities = data.user?.[0]?.progresses || [];
        const activityByDate = {};
        
        activities.forEach(activity => {
            const date = new Date(activity.createdAt).toISOString().split('T')[0];
            activityByDate[date] = (activityByDate[date] || 0) + 1;
        });
        
        // Convert to array format suitable for a heatmap
        return Object.entries(activityByDate)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
}

// Export as a singleton
export const apiService = new ApiService();