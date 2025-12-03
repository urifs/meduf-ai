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
export async function pollTask(taskId, onProgress = null, pollInterval = 2000, maxAttempts = 600) {
  let attempts = 0;
  let consecutiveErrors = 0;
  
  console.log(`[aiPolling] Starting polling for task ${taskId} (max ${maxAttempts} attempts = ${maxAttempts * pollInterval / 60000} minutes)`);
  
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
      
      // If too many consecutive errors, fail (increased to 10)
      if (consecutiveErrors >= 10) {
        console.error('[aiPolling] Too many consecutive polling errors');
        throw new Error('Erro de conexão persistente. Por favor, verifique sua internet e tente novamente.');
      }
      
      // Other errors, retry
      console.error('Polling error (attempt ' + consecutiveErrors + '):', error.message);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }
  }
  
  // Timeout - with 600 attempts at 2s each = 20 minutes
  console.error('[aiPolling] Polling timeout after', attempts, 'attempts (', (attempts * pollInterval / 60000), 'minutes)');
  throw new Error('Análise está demorando mais que o esperado (>20min). A análise pode ter sido concluída. Tente recarregar a página ou consultar o histórico.');
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
