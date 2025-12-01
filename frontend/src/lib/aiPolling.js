/**
 * AI Polling Utility
 * Handles polling for background AI tasks
 */

import { api } from './api';

/**
 * Poll a background task until completion
 * @param {string} taskId - Task ID returned from initial API call
 * @param {function} onProgress - Callback for progress updates (optional)
 * @param {number} pollInterval - Polling interval in ms (default 2000)
 * @param {number} maxAttempts - Max polling attempts (default 150 = 5 minutes)
 * @returns {Promise<object>} - Final result when task completes
 */
export async function pollTask(taskId, onProgress = null, pollInterval = 2000, maxAttempts = 150) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      // Get task status
      const response = await api.get(`/api/ai/tasks/${taskId}`);
      const task = response.data;
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(task);
      }
      
      // Check if completed
      if (task.status === 'completed') {
        return task.result;
      }
      
      // Check if failed
      if (task.status === 'failed') {
        throw new Error(task.error || 'Task failed');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
      
    } catch (error) {
      // If it's a 404, task not found
      if (error.response?.status === 404) {
        throw new Error('Task não encontrada');
      }
      // Other errors, retry
      console.error('Polling error:', error);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }
  }
  
  // Timeout
  throw new Error('Tempo limite excedido. Por favor, tente novamente.');
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
    // Step 1: Start the task
    const response = await api.post(endpoint, data);
    const { task_id } = response.data;
    
    if (!task_id) {
      throw new Error('No task_id returned from server');
    }
    
    // Step 2: Poll for result
    const result = await pollTask(task_id, onProgress);
    
    return result;
    
  } catch (error) {
    console.error('AI Task error:', error);
    throw error;
  }
}
