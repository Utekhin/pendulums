// session.js

const Session = (() => {
    const SESSION_KEY = 'userSessionID';

    // Generate a random unique session ID
    function generateSessionID() {
        return 'sess-' + Math.random().toString(36).substr(2, 16) + '-' + Date.now();
    }

    // Retrieve or create a session ID
    function getSessionID() {
        let sessionID = localStorage.getItem(SESSION_KEY);

        if (!sessionID) {
            sessionID = generateSessionID();
            localStorage.setItem(SESSION_KEY, sessionID);
            console.log('New session created:', sessionID);
        } else {
            console.log('Existing session:', sessionID);
        }

        return sessionID;
    }

    return {
        getSessionID
    };
})();

export default Session;
