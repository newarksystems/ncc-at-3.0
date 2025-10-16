import { jwtDecode } from 'jwt-decode';
import { apiService } from '@/services/api';

interface JwtPayload {
  exp: number;
  sub: string;
  user_id: string;
}

class AuthService {
  private static instance: AuthService;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private logoutWarningTimer: NodeJS.Timeout | null = null;
  private readonly TOKEN_EXPIRY_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
  private readonly LOGOUT_WARNING_TIME = 10 * 1000; // 10 seconds for logout warning

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Decode JWT token to get expiration time
   */
  private decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get time until token expires in milliseconds
   */
  getTimeUntilExpiry(token: string): number | null {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return null;
    
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    return expiryTime - currentTime;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry(token);
    return timeUntilExpiry !== null && timeUntilExpiry <= 0;
  }

  /**
   * Schedule token refresh before expiry
   */
  scheduleTokenRefresh(accessToken: string, refreshToken: string) {
    // Clear any existing timers
    this.clearTimers();
    
    const timeUntilExpiry = this.getTimeUntilExpiry(accessToken);
    if (timeUntilExpiry === null) return;
    
    // Schedule refresh 5 minutes before token expires
    const refreshTime = Math.max(timeUntilExpiry - this.TOKEN_EXPIRY_WARNING_TIME, 0);
    
    this.tokenRefreshTimer = setTimeout(async () => {
      try {
        await this.refreshAccessToken(refreshToken);
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // If refresh fails, show logout warning
        this.scheduleLogoutWarning();
      }
    }, refreshTime);
  }

  /**
   * Schedule logout warning when token is about to expire
   */
  scheduleLogoutWarning() {
    if (this.logoutWarningTimer) {
      clearTimeout(this.logoutWarningTimer);
    }
    
    this.logoutWarningTimer = setTimeout(() => {
      // Show logout warning modal to user
      this.showLogoutWarning();
    }, this.LOGOUT_WARNING_TIME);
  }

  /**
   * Show logout warning to user
   */
  private showLogoutWarning() {
    // Dispatch a custom event that components can listen to
    const event = new CustomEvent('auth-token-expiring', {
      detail: {
        message: 'Your session is about to expire. Would you like to stay signed in?'
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; token_type: string } | null> {
    try {
      const response = await apiService.refreshToken(refreshToken);
      
      // Store new access token
      localStorage.setItem('access_token', response.access_token);
      
      // Schedule next refresh
      this.scheduleTokenRefresh(response.access_token, refreshToken);
      
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      this.logout();
      return null;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Clear timers
      this.clearTimers();
      
      // Dispatch logout event
      const event = new CustomEvent('auth-logout');
      window.dispatchEvent(event);
    }
  }

  /**
   * Handle user staying signed in after warning
   */
  async extendSession() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const response = await this.refreshAccessToken(refreshToken);
        if (response) {
          // Session extended successfully
          const event = new CustomEvent('auth-session-extended');
          window.dispatchEvent(event);
          return true;
        }
      } catch (error) {
        console.error('Failed to extend session:', error);
      }
    }
    
    // If we can't extend session, logout
    this.logout();
    return false;
  }

  /**
   * Clear all scheduled timers
   */
  clearTimers() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    if (this.logoutWarningTimer) {
      clearTimeout(this.logoutWarningTimer);
      this.logoutWarningTimer = null;
    }
  }

  /**
   * Initialize auth service with existing tokens
   */
  initialize() {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (accessToken && refreshToken) {
      // Check if token is already expired
      if (this.isTokenExpired(accessToken)) {
        // Try to refresh immediately
        this.refreshAccessToken(refreshToken);
      } else {
        // Schedule refresh
        this.scheduleTokenRefresh(accessToken, refreshToken);
      }
    }
  }

  /**
   * Schedule token refresh with error handling
   */
  scheduleTokenRefreshWithErrorHandling(accessToken: string, refreshToken: string) {
    // Clear any existing timers
    this.clearTimers();
    
    const timeUntilExpiry = this.getTimeUntilExpiry(accessToken);
    if (timeUntilExpiry === null) return;
    
    // Schedule refresh 5 minutes before token expires
    const refreshTime = Math.max(timeUntilExpiry - this.TOKEN_EXPIRY_WARNING_TIME, 0);
    
    this.tokenRefreshTimer = setTimeout(async () => {
      try {
        const response = await apiService.refreshToken(refreshToken);
        
        // Store new access token
        localStorage.setItem('access_token', response.access_token);
        
        // Schedule next refresh
        this.scheduleTokenRefreshWithErrorHandling(response.access_token, refreshToken);
        
        // Dispatch session extended event
        const event = new CustomEvent('auth-session-extended');
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, logout user
        this.logout();
      }
    }, refreshTime);
  }
}

export const authService = AuthService.getInstance();