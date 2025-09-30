export function getAccessToken(): string | null {
	if (typeof window === 'undefined' || !window.localStorage) return null;

	// 1) token directo
	const direct = localStorage.getItem('accessToken');
	if (direct) return direct;

	// 2) objeto auth_tokens { accessToken: "" }
	const authTokensRaw = localStorage.getItem('auth_tokens');
	if (authTokensRaw) {
		try {
			const parsed = JSON.parse(authTokensRaw);
			if ((parsed as any)?.accessToken) return (parsed as any).accessToken;
		} catch {}
	}

	// 3) llaves PNC (como en tus capturas)
	const pnc = localStorage.getItem('pnc_access_token');
	if (pnc) return pnc;

	return null;
}

export function getUserRole(): string | null {
	if (typeof window === 'undefined' || !window.localStorage) return null;

	// 1) direct key variants
	const directKeys = ['pnc_user_role', 'user_role', 'role', 'pncRole', 'userRole']
	for (const k of directKeys) {
		const v = localStorage.getItem(k)
		if (v) return v
	}

	// 2) common objects which may contain the role
	const jsonKeys = ['pnc_user', 'auth_user', 'auth_user_info', 'user', 'profile']
	for (const k of jsonKeys) {
		const raw = localStorage.getItem(k)
		if (!raw) continue
		try {
			const parsed = JSON.parse(raw as string)
			const maybe = (parsed && (parsed.role || parsed.rol || parsed.user_role || parsed.userRole || parsed.roleName))
			if (maybe) return typeof maybe === 'string' ? maybe : String(maybe)
		} catch (e) {
			// skip parse errors
		}
	}

	return null
}

export function isAdmin(): boolean {
	return (getUserRole() || '').toLowerCase() === 'admin';
}
