const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Helper to handle fetch responses and errors
 */
async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `API Error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail);
      }
    } catch (e) {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  /**
   * Login or register user by username
   */
  async loginUser(username, telegramId = null, email = null) {
    return fetchJson('/users/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        telegram_id: telegramId,
        email: email,
      }),
    });
  },

  /**
   * Get all topics
   */
  async getTopics() {
    return fetchJson('/topics');
  },

  /**
   * Get all levels
   */
  async getLevels() {
    return fetchJson('/levels');
  },

  /**
   * Generate an exercise sentence
   */
  async generateExercise(userId, topicId, levelId, difficulty = 'medium') {
    return fetchJson('/exercise/generate', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        topic_id: topicId,
        level_id: levelId,
        difficulty: difficulty,
      }),
    });
  },

  /**
   * Submit an exercise translation for grading
   */
  async submitExercise(userId, sentenceId, userAnswer) {
    return fetchJson('/exercise/submit', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        sentence_id: sentenceId,
        user_answer: userAnswer,
      }),
    });
  },

  /**
   * Get user progress statistics
   */
  async getUserStats(userId) {
    return fetchJson(`/users/${userId}/stats`);
  },
};
