import axios from 'axios';
import { getAccessToken } from '../session';

// Use NEXT_PUBLIC_API_BASE_URL to fully qualify the backend, defaulting to localhost with /api/v1
const baseURL =
	(typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_API_BASE_URL) ||
	'http://localhost:4000/api/v1';

const withCredentials =
	(typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_WITH_CREDENTIALS) === 'true';

const api = axios.create({ baseURL, withCredentials });

api.interceptors.request.use((config) => {
	const token = getAccessToken();
	if (token) {
		config.headers = config.headers ?? {};
		(config.headers as any).Authorization = `Bearer ${token}`;
	}
	return config;
});

export default api;

