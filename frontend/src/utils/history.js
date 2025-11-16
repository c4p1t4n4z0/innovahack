// Utilidades para manejar historiales de simulaciones y análisis

export const saveSimulationToHistory = (simulationData) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.username || 'guest';
    const key = `simulation_history_${userId}`;
    
    // Obtener historial existente
    const existing = localStorage.getItem(key);
    const history = existing ? JSON.parse(existing) : [];
    
    // Crear nueva entrada con timestamp
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      fecha: new Date().toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      ...simulationData
    };
    
    // Agregar al inicio del array (más reciente primero)
    history.unshift(newEntry);
    
    // Limitar a últimos 50 registros para no ocupar demasiado espacio
    const limitedHistory = history.slice(0, 50);
    
    // Guardar
    localStorage.setItem(key, JSON.stringify(limitedHistory));
    
    return newEntry;
  } catch (e) {
    console.error('Error al guardar simulación en historial:', e);
    return null;
  }
};

export const getSimulationHistory = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.username || 'guest';
    const key = `simulation_history_${userId}`;
    
    const history = localStorage.getItem(key);
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error('Error al leer historial de simulaciones:', e);
    return [];
  }
};

export const deleteSimulationFromHistory = (simulationId) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.username || 'guest';
    const key = `simulation_history_${userId}`;
    
    const history = getSimulationHistory();
    const filtered = history.filter(item => item.id !== simulationId);
    localStorage.setItem(key, JSON.stringify(filtered));
    
    return true;
  } catch (e) {
    console.error('Error al eliminar simulación del historial:', e);
    return false;
  }
};

export const saveViabilityAnalysisToHistory = (analysisData) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.username || 'guest';
    const key = `viability_history_${userId}`;
    
    // Obtener historial existente
    const existing = localStorage.getItem(key);
    const history = existing ? JSON.parse(existing) : [];
    
    // Crear nueva entrada con timestamp
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      fecha: new Date().toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      ...analysisData
    };
    
    // Agregar al inicio del array (más reciente primero)
    history.unshift(newEntry);
    
    // Limitar a últimos 50 registros
    const limitedHistory = history.slice(0, 50);
    
    // Guardar
    localStorage.setItem(key, JSON.stringify(limitedHistory));
    
    return newEntry;
  } catch (e) {
    console.error('Error al guardar análisis en historial:', e);
    return null;
  }
};

export const getViabilityHistory = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.username || 'guest';
    const key = `viability_history_${userId}`;
    
    const history = localStorage.getItem(key);
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error('Error al leer historial de análisis:', e);
    return [];
  }
};

export const deleteViabilityFromHistory = (analysisId) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.username || 'guest';
    const key = `viability_history_${userId}`;
    
    const history = getViabilityHistory();
    const filtered = history.filter(item => item.id !== analysisId);
    localStorage.setItem(key, JSON.stringify(filtered));
    
    return true;
  } catch (e) {
    console.error('Error al eliminar análisis del historial:', e);
    return false;
  }
};

