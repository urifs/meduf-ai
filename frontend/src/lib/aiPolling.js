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
export async function pollTask(taskId, onProgress = null, pollInterval = 2000, maxAttempts = 300) {
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
      
      // Check if failed
      if (task.status === 'failed') {
        console.error('Task failed:', task.error);
        throw new Error(task.error || 'Erro ao processar análise');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
      
    } catch (error) {
      consecutiveErrors++;
      
      // If it's a 404, task not found
      if (error.response?.status === 404) {
        throw new Error('Tarefa não encontrada no servidor');
      }
      
      // If too many consecutive errors, fail
      if (consecutiveErrors >= 5) {
        console.error('Too many consecutive polling errors');
        throw new Error('Erro de conexão. Por favor, tente novamente.');
      }
      
      // Other errors, retry
      console.error('Polling error (attempt ' + consecutiveErrors + '):', error.message);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }
  }
  
  // Timeout - but this should be rare with 300 attempts (10 minutes)
  console.error('Polling timeout after', attempts, 'attempts');
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
    console.log("[aiPolling] Starting AI task");
    console.log("[aiPolling] Endpoint:", endpoint);
    console.log("[aiPolling] Data:", data);
    
    // Step 1: Start the task
    console.log("[aiPolling] Making POST request to:", endpoint);
    const response = await api.post(endpoint, data);
    console.log("[aiPolling] Response received:", response.data);
    
    const { task_id } = response.data;
    
    if (!task_id) {
      console.error("[aiPolling] No task_id in response:", response.data);
      throw new Error('No task_id returned from server');
    }
    
    console.log("[aiPolling] Task ID:", task_id);
    
    // Step 2: Poll for result
    console.log("[aiPolling] Starting polling for task:", task_id);
    const result = await pollTask(task_id, onProgress);
    
    console.log("[aiPolling] Task completed with result:", result);
    return result;
    
  } catch (error) {
    console.error('[aiPolling] AI Task error:', error);
    console.error('[aiPolling] Error details:', error.response?.data || error.message);
    throw error;
  }
}
