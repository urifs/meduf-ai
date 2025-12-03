/**
 * AI Polling Utility
 * Handles polling for background AI tasks
 */

import api from './api';

/**
 * Poll a background task until completion
 * @param {string} taskId - Task ID returned from initial API call
 * @param {function} onProgress - Callback for progress updates (optional)
 * @param {number} pollInterval - Polling interval in ms (default 2000)
 * @param {number} maxAttempts - Max polling attempts (default 150 = 5 minutes)
 * @returns {Promise<object>} - Final result when task completes
 */
export async function pollTask(taskId, onProgress = null, pollInterval = 3000, maxAttempts = 1200) {
  let attempts = 0;
  let consecutiveErrors = 0;
  
  while (attempts < maxAttempts) {
    try {
      // Get task status
      const response = await api.get(`/ai/tasks/${taskId}`);
      const task = response.data;
      
      // Reset error counter on success
      consecutiveErrors = 0;
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(task);
      }
      
      // Check if completed
      if (task.status === 'completed') {
        return task.result;
      }
      
      // Check if failed - but continue retrying (backend has retry mechanism)
      if (task.status === 'failed') {
        // Don't throw immediately, let backend retry mechanism work
        // Only throw after many attempts
        if (attempts > 20) {
          throw new Error(task.error || 'Erro ao processar análise');
        }
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
      
    } catch (error) {
      consecutiveErrors++;
      
      // Be very patient with errors - only fail after many consecutive errors
      if (consecutiveErrors >= 50) {
        throw new Error('Não foi possível completar a análise. Por favor, tente novamente.');
      }
      
      // Other errors, retry silently (no error thrown)
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }
  }
  
  // Timeout - with 1200 attempts at 3s each = 60 minutes (1 hour)
  throw new Error('Análise está demorando mais que o esperado. Por favor, tente novamente.');
}

/**
 * Start a background AI consensus task and poll for result
 * @param {string} endpoint - API endpoint (e.g., '/api/ai/consensus/diagnosis')
 * @param {object} data - Request payload
 * @param {function} onProgress - Progress callback (optional)
 * @returns {Promise<object>} - Final result
 */
export async function startAITask(endpoint, data, onProgress = null) {
  try {
    const response = await api.post(endpoint, data);
    const { task_id } = response.data;
    
    if (!task_id) {
      throw new Error('No task_id returned from server');
    }
    
    const result = await pollTask(task_id, onProgress);
    return result;
    
  } catch (error) {
    console.error('[aiPolling] Error:', error.message);
    throw error;
  }
}
