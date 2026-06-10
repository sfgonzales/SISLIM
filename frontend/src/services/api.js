const API_URL = import.meta.env.VITE_API_URL || '';

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!headers['Content-Type'] && !(options.body instanceof URLSearchParams)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    const error = new Error(errorData.detail || 'Error en la petición');
    error.response = { data: errorData, status: response.status };
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
};

export const login = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  
  const response = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  });
  
  if (!response.ok) {
    let errorData;
    try { errorData = await response.json(); } catch { errorData = { detail: 'Credenciales inválidas' }; }
    const error = new Error(errorData.detail);
    error.response = { data: errorData };
    throw error;
  }
  
  return response.json();
};

export const getCurrentUser = async () => {
  return fetchWithAuth('/users/me/');
};

export const getUsers = async () => {
  return fetchWithAuth('/users/');
};

export const createUser = async (userData) => {
  return fetchWithAuth('/users/', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

export const updateUser = async (userId, userData) => {
  return fetchWithAuth(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  });
};

export const deleteUser = async (userId) => {
  return fetchWithAuth(`/users/${userId}`, {
    method: 'DELETE'
  });
};

// --- Services APIs ---

export const getServices = async () => {
  return fetchWithAuth('/services/');
};

export const getPublicServices = async (limit = 6) => {
  return fetchWithAuth(`/public/services/?limit=${limit}`);
};

export const createService = async (serviceData) => {
  return fetchWithAuth('/services/', {
    method: 'POST',
    body: JSON.stringify(serviceData)
  });
};

export const updateService = async (serviceId, serviceData) => {
  return fetchWithAuth(`/services/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify(serviceData)
  });
};

export const deleteService = async (serviceId) => {
  return fetchWithAuth(`/services/${serviceId}`, {
    method: 'DELETE'
  });
};

export const updateServiceStatus = async (serviceId, status) => {
  return fetchWithAuth(`/services/${serviceId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

// --- Sprint 3 APIs ---

export const searchMarketplaceServices = async (params) => {
  // Filtrar parámetros indefinidos o vacíos
  const validParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ''));
  const queryParams = new URLSearchParams(validParams).toString();
  return fetchWithAuth(`/marketplace/services/?${queryParams}`);
};

export const createServiceRequest = async (requestData) => {
  return fetchWithAuth('/service-requests/', {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
};

export const getMyServiceRequests = async () => {
  return fetchWithAuth('/service-requests/mine/');
};

export const getIncomingServiceRequests = async () => {
  return fetchWithAuth('/service-requests/incoming/');
};

export const updateServiceRequestStatus = async (requestId, status) => {
  return fetchWithAuth(`/service-requests/${requestId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export default { login, getCurrentUser };
