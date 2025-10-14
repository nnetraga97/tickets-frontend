import { postJson } from "./client";
import { logApiDirect, logErrorDirect } from "../store/logger";

export type LoginRequest = {
    username: string;
    password: string;
};

export type LoginResponse = {
    token: string;
    username: string;
    email: string;
    full_name: string;
    role: string;
};

export async function login(credentials: LoginRequest, signal?: AbortSignal): Promise<LoginResponse> {
    logApiDirect('login_api_start', { username: credentials.username }, 'api/auth.ts');
    
    try {
        const response = await postJson<LoginResponse>(
            '/api/auth/login',
            credentials,
            { signal, metaname: 'auth:login' }
        );
        
        logApiDirect('login_api_success', { 
            username: response.username,
            role: response.role,
            hasToken: !!response.token
        }, 'api/auth.ts');
        
        return response;
    } catch (err) {
        logErrorDirect('login_api_error', err, { username: credentials.username });
        throw err;
    }
}

