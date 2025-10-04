import axios from 'axios';
import { getAccessToken } from '../session';

// Prefer explicit env var, otherwise use relative base to same-origin API gateway
const baseURL =
    (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_API_URL) ||
    '/api/v1';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
	const token = getAccessToken();
	if (token) {
		config.headers = config.headers ?? {};
		(config.headers as any).Authorization = `Bearer ${token}`;
	}
	return config;
});

export default api;

