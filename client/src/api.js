const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fullPath = path.startsWith('/api') ? path : `/api${path}`;
  const res = await fetch(`${BASE_URL}${fullPath}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}
