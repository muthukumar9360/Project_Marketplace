const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const createPaymentRequest = async (projectId, projectName, amount) => {
  const res = await fetch(`${API_URL}/payment/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, projectName, amount })
  });
  if (!res.ok) throw new Error('Failed to create request');
  return res.json();
};

export const getPaymentRequest = async (requestId) => {
  const res = await fetch(`${API_URL}/payment/request/${requestId}`);
  if (!res.ok) throw new Error('Failed to fetch request');
  return res.json();
};

export const validateDownloadToken = async (token) => {
  const res = await fetch(`${API_URL}/download/validate/${token}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw { status: res.status, ...errorData };
  }
  return res.json();
};

export const adminGetRequests = async (credentials) => {
  const res = await fetch(`${API_URL}/admin/payment/requests`, {
    headers: {
      'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
    }
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
};

export const adminAcceptPayment = async (requestId, credentials) => {
  const res = await fetch(`${API_URL}/admin/payment/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
    },
    body: JSON.stringify({ requestId })
  });
  if (!res.ok) throw new Error('Failed to accept');
  return res.json();
};

export const adminDeclinePayment = async (requestId, credentials) => {
  const res = await fetch(`${API_URL}/admin/payment/decline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
    },
    body: JSON.stringify({ requestId })
  });
  if (!res.ok) throw new Error('Failed to decline');
  return res.json();
};

export const getDownloadUrl = (token) => {
  return `${API_URL}/download/${token}`;
};

export const getProjects = async () => {
  const res = await fetch(`${API_URL}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
};

export const adminGetGithubRepos = async () => {
  const profileUrl = 'https://github.com/muthukumar9360';
  const username = profileUrl.split('/').pop() || 'muthukumar9360';
  const res = await fetch(`https://api.github.com/users/${username}/repos?type=public&sort=updated`);
  if (!res.ok) throw new Error('Failed to fetch github repos from GitHub API');
  return res.json();
};

export const adminPublishProject = async (project, credentials) => {
  const res = await fetch(`${API_URL}/admin/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
    },
    body: JSON.stringify(project)
  });
  if (!res.ok) throw new Error('Failed to publish project');
  return res.json();
};

export const getSettings = async () => {
  const res = await fetch(`${API_URL}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

export const adminUpdateSettings = async (settings, credentials) => {
  const res = await fetch(`${API_URL}/admin/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
    },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
};

export const adminSaveFcmToken = async (token, credentials) => {
  const res = await fetch(`${API_URL}/admin/fcm-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
    },
    body: JSON.stringify({ token })
  });
  if (!res.ok) throw new Error('Failed to save FCM token');
  return res.json();
};
