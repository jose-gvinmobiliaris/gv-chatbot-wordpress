const API_BASE_URL = window.GV_CHATBOT_CONFIG?.apiBaseUrl;

const ChatAPI = {

    async request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        if (data !== null) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        const result = await response.json();

        if (!response.ok || result.success === false) {
            throw new Error(result.message || 'Error de comunicación con Laravel.');
        }

        return result;
    },

    start() {
        return this.request('/start', 'POST');
    },

    getLocations() {
        return this.request('/locations');
    },

    sendMessage(token, content) {
        return this.request('/message', 'POST', {
            token,
            content
        });
    },

    selectProject(token, wordpressProjectId) {
        return this.request('/select-project', 'POST', {
            token,
            wordpress_project_id: wordpressProjectId
        });
    },

    captureContactDetails(token, phone, email) {
        return this.request('/contact-details', 'POST', {
            token,
            phone,
            email
        });
    },

    history(token) {
        return this.request(`/history?token=${encodeURIComponent(token)}`);
    },

    close(token) {
        return this.request('/close', 'POST', { token });
    }
};