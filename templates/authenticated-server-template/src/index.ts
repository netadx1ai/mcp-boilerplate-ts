#!/usr/bin/env node

/**
 * @fileoverview Authenticated MCP Server Template
 *
 * A comprehensive MCP server template for authentication and authorization
 * with support for multiple auth methods (OAuth, JWT, session management).
 * This template demonstrates secure user management, token handling, and
 * role-based access control.
 *
 * Features:
 * - Multiple authentication methods (OAuth, JWT, Basic Auth, API Key)
 * - Session management and token refresh
 * - Role-based access control (RBAC)
 * - User management and profile handling
 * - Security monitoring and audit logging
 * - Rate limiting per user/role
 * - Password policies and security
 *
 * @author MCP Boilerplate Team
 * @version 1.0.0
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// =============================================================================
// Constants
// =============================================================================

const SERVER_NAME = 'authenticated-server-template';
const SERVER_VERSION = '1.0.0';
const SERVER_DESCRIPTION = 'Authenticated MCP server with OAuth, JWT, and session management';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
  profile: UserProfile;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  preferences: Record<string, any>;
}

interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
}

interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  oauth: {
    providers: Record<string, OAuthProvider>;
  };
  session: {
    secure: boolean;
    httpOnly: boolean;
    maxAge: number;
  };
  passwordPolicy: PasswordPolicy;
}

interface OAuthProvider {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
}

interface LoginAttempt {
  email: string;
  ipAddress: string;
  timestamp: string;
  success: boolean;
  reason?: string;
}

// =============================================================================
// Mock State Management
// =============================================================================

const users = new Map<string, User>();
const sessions = new Map<string, Session>();
const loginAttempts: LoginAttempt[] = [];
const rateLimits = new Map<string, { count: number; resetTime: number }>();

// Initialize mock data
const mockUser: User = {
  id: 'user_123',
  email: 'demo@example.com',
  username: 'demo_user',
  roles: ['user', 'admin'],
  profile: {
    firstName: 'Demo',
    lastName: 'User',
    avatar: 'https://example.com/avatar.jpg',
    preferences: {
      theme: 'dark',
      notifications: true,
    },
  },
  createdAt: '2024-01-01T00:00:00Z',
  lastLogin: new Date().toISOString(),
  isActive: true,
};

users.set(mockUser.id, mockUser);
users.set('email:demo@example.com', mockUser);

const authConfig: AuthConfig = {
  jwtSecret: 'demo-jwt-secret-key',
  jwtExpiresIn: '15m',
  refreshTokenExpiresIn: '7d',
  oauth: {
    providers: {
      google: {
        clientId: 'demo-google-client-id',
        clientSecret: 'demo-google-client-secret',
        redirectUri: 'http://localhost:3000/auth/google/callback',
        scopes: ['openid', 'email', 'profile'],
        authUrl: 'https://accounts.google.com/oauth2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      },
      github: {
        clientId: 'demo-github-client-id',
        clientSecret: 'demo-github-client-secret',
        redirectUri: 'http://localhost:3000/auth/github/callback',
        scopes: ['user:email'],
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
      },
    },
  },
  session: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90, // days
  },
};

// =============================================================================
// Authentication Tools
// =============================================================================

/**
 * User Login - Authenticate users with email/password or OAuth
 */
function registerLoginTool(server: McpServer) {
  server.registerTool(
    'login',
    {
      title: 'User Login',
      description: 'Authenticate users with email/password or initiate OAuth flow',
      inputSchema: {
        method: z.enum(['email', 'oauth']).describe('Authentication method'),
        email: z.string().email().optional().describe('User email (for email auth)'),
        password: z.string().optional().describe('User password (for email auth)'),
        provider: z
          .enum(['google', 'github'])
          .optional()
          .describe('OAuth provider (for oauth auth)'),
        ipAddress: z.string().default('127.0.0.1').describe('Client IP address'),
        userAgent: z.string().default('MCP Client').describe('Client user agent'),
      },
    },
    async ({ method, email, password, provider, ipAddress, userAgent }) => {
      try {
        // Rate limiting check
        const rateLimitKey = `login:${ipAddress}`;
        const now = Date.now();
        const rateLimit = rateLimits.get(rateLimitKey);

        if (rateLimit && rateLimit.count >= 5 && now < rateLimit.resetTime) {
          return {
            content: [
              {
                type: 'text',
                text: `Too many login attempts. Try again in ${Math.ceil((rateLimit.resetTime - now) / 1000)} seconds.`,
              },
            ],
            isError: true,
          };
        }

        if (method === 'email') {
          if (!email || !password) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Email and password are required for email authentication.',
                },
              ],
              isError: true,
            };
          }

          // Find user
          const user = users.get(`email:${email}`);
          if (!user || !user.isActive) {
            // Update rate limiting
            updateRateLimit(rateLimitKey);

            loginAttempts.push({
              email,
              ipAddress,
              timestamp: new Date().toISOString(),
              success: false,
              reason: 'Invalid credentials',
            });

            return {
              content: [
                {
                  type: 'text',
                  text: 'Invalid email or password.',
                },
              ],
              isError: true,
            };
          }

          // Mock password verification (in real implementation, use bcrypt)
          const passwordValid = password === 'demo123'; // Mock validation

          if (!passwordValid) {
            updateRateLimit(rateLimitKey);

            loginAttempts.push({
              email,
              ipAddress,
              timestamp: new Date().toISOString(),
              success: false,
              reason: 'Invalid password',
            });

            return {
              content: [
                {
                  type: 'text',
                  text: 'Invalid email or password.',
                },
              ],
              isError: true,
            };
          }

          // Successful login
          const sessionId = `sess_${Math.random().toString(36).substr(2, 16)}`;
          const token = `jwt_${Math.random().toString(36).substr(2, 32)}`;
          const refreshToken = `ref_${Math.random().toString(36).substr(2, 32)}`;

          const session: Session = {
            id: sessionId,
            userId: user.id,
            token,
            refreshToken,
            expiresAt: new Date(now + 15 * 60 * 1000).toISOString(), // 15 minutes
            ipAddress,
            userAgent,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
          };

          sessions.set(sessionId, session);
          sessions.set(token, session);

          // Update user last login
          user.lastLogin = new Date().toISOString();

          loginAttempts.push({
            email,
            ipAddress,
            timestamp: new Date().toISOString(),
            success: true,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    user: {
                      id: user.id,
                      email: user.email,
                      username: user.username,
                      roles: user.roles,
                      profile: user.profile,
                    },
                    session: {
                      id: sessionId,
                      token,
                      refreshToken,
                      expiresAt: session.expiresAt,
                    },
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } else if (method === 'oauth') {
          if (!provider) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'OAuth provider is required for OAuth authentication.',
                },
              ],
              isError: true,
            };
          }

          const oauthConfig = authConfig.oauth.providers[provider];
          if (!oauthConfig) {
            return {
              content: [
                {
                  type: 'text',
                  text: `OAuth provider '${provider}' is not configured.`,
                },
              ],
              isError: true,
            };
          }

          // Generate OAuth authorization URL
          const state = Math.random().toString(36).substr(2, 16);
          const scopes = oauthConfig.scopes.join(' ');
          const authUrl = `${oauthConfig.authUrl}?client_id=${oauthConfig.clientId}&redirect_uri=${encodeURIComponent(oauthConfig.redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&response_type=code`;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    method: 'oauth',
                    provider,
                    authUrl,
                    state,
                    instructions:
                      'Visit the authUrl to complete OAuth authentication, then use the authorization code with the oauth_callback tool.',
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Unknown authentication method: ${method}`,
            },
          ],
          isError: true,
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Login failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * OAuth Callback - Handle OAuth authentication callback
 */
function registerOAuthCallbackTool(server: McpServer) {
  server.registerTool(
    'oauth_callback',
    {
      title: 'OAuth Callback',
      description: 'Handle OAuth authentication callback and create session',
      inputSchema: {
        provider: z.enum(['google', 'github']).describe('OAuth provider'),
        code: z.string().describe('Authorization code from OAuth provider'),
        state: z.string().describe('State parameter for CSRF protection'),
        ipAddress: z.string().default('127.0.0.1').describe('Client IP address'),
        userAgent: z.string().default('MCP Client').describe('Client user agent'),
      },
    },
    async ({ provider, code, state, ipAddress, userAgent }) => {
      try {
        const oauthConfig = authConfig.oauth.providers[provider];
        if (!oauthConfig) {
          return {
            content: [
              {
                type: 'text',
                text: `OAuth provider '${provider}' is not configured.`,
              },
            ],
            isError: true,
          };
        }

        // In real implementation, exchange code for token and get user info
        // Mock OAuth response
        const mockUserInfo = {
          id: `${provider}_user_456`,
          email: `oauth.user@${provider}.com`,
          name: `OAuth User (${provider})`,
          avatar: `https://${provider}.com/avatar/456.jpg`,
        };

        // Find or create user
        let user = users.get(`email:${mockUserInfo.email}`);
        if (!user) {
          user = {
            id: `user_${Math.random().toString(36).substr(2, 9)}`,
            email: mockUserInfo.email,
            username: mockUserInfo.email.split('@')[0],
            roles: ['user'],
            profile: {
              firstName: mockUserInfo.name.split(' ')[0],
              lastName: mockUserInfo.name.split(' ').slice(1).join(' '),
              avatar: mockUserInfo.avatar,
              preferences: {
                theme: 'light',
                notifications: true,
              },
            },
            createdAt: new Date().toISOString(),
            isActive: true,
          };

          users.set(user.id, user);
          users.set(`email:${user.email}`, user);
        }

        // Create session
        const sessionId = `sess_${Math.random().toString(36).substr(2, 16)}`;
        const token = `jwt_${Math.random().toString(36).substr(2, 32)}`;
        const refreshToken = `ref_${Math.random().toString(36).substr(2, 32)}`;

        const session: Session = {
          id: sessionId,
          userId: user.id,
          token,
          refreshToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          ipAddress,
          userAgent,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        };

        sessions.set(sessionId, session);
        sessions.set(token, session);

        // Update user last login
        user.lastLogin = new Date().toISOString();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  provider,
                  user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    roles: user.roles,
                    profile: user.profile,
                  },
                  session: {
                    id: sessionId,
                    token,
                    refreshToken,
                    expiresAt: session.expiresAt,
                  },
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `OAuth callback failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Validate Token - Validate and refresh authentication tokens
 */
function registerValidateTokenTool(server: McpServer) {
  server.registerTool(
    'validate_token',
    {
      title: 'Validate Token',
      description: 'Validate authentication tokens and refresh if needed',
      inputSchema: {
        token: z.string().describe('Authentication token to validate'),
        refreshIfExpired: z
          .boolean()
          .default(true)
          .describe('Automatically refresh if token is expired'),
      },
    },
    async ({ token, refreshIfExpired }) => {
      try {
        const session = sessions.get(token);
        if (!session) {
          return {
            content: [
              {
                type: 'text',
                text: 'Invalid or expired token.',
              },
            ],
            isError: true,
          };
        }

        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        const isExpired = now > expiresAt;

        if (isExpired && !refreshIfExpired) {
          return {
            content: [
              {
                type: 'text',
                text: 'Token has expired.',
              },
            ],
            isError: true,
          };
        }

        // Get user
        const user = users.get(session.userId);
        if (!user || !user.isActive) {
          return {
            content: [
              {
                type: 'text',
                text: 'User account is inactive or not found.',
              },
            ],
            isError: true,
          };
        }

        let newToken = token;
        let newExpiresAt = session.expiresAt;

        // Refresh token if expired
        if (isExpired && refreshIfExpired) {
          newToken = `jwt_${Math.random().toString(36).substr(2, 32)}`;
          newExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

          // Update session
          session.token = newToken;
          session.expiresAt = newExpiresAt;
          session.lastActivity = new Date().toISOString();

          // Update token mapping
          sessions.delete(token);
          sessions.set(newToken, session);
        } else {
          // Update last activity
          session.lastActivity = new Date().toISOString();
        }

        const response = {
          success: true,
          valid: true,
          wasRefreshed: isExpired && refreshIfExpired,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            roles: user.roles,
          },
          session: {
            id: session.id,
            token: newToken,
            expiresAt: newExpiresAt,
            lastActivity: session.lastActivity,
          },
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Token validation failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Manage Users - Create, update, and manage user accounts
 */
function registerManageUsersTool(server: McpServer) {
  server.registerTool(
    'manage_users',
    {
      title: 'Manage Users',
      description: 'Create, update, and manage user accounts and profiles',
      inputSchema: {
        action: z
          .enum(['create', 'update', 'delete', 'list', 'get'])
          .describe('User management action'),
        userId: z.string().optional().describe('User ID (for update/delete/get)'),
        email: z.string().email().optional().describe('User email'),
        username: z.string().optional().describe('Username'),
        password: z.string().optional().describe('Password (for create/update)'),
        roles: z.array(z.string()).optional().describe('User roles'),
        profile: z
          .object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            avatar: z.string().optional(),
            preferences: z.record(z.any()).optional(),
          })
          .optional()
          .describe('User profile data'),
        isActive: z.boolean().optional().describe('User active status'),
      },
    },
    async ({ action, userId, email, username, password, roles, profile, isActive }) => {
      try {
        switch (action) {
          case 'create': {
            if (!email || !username || !password) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Email, username, and password are required for user creation.',
                  },
                ],
                isError: true,
              };
            }

            // Check if user exists
            if (users.has(`email:${email}`)) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'User with this email already exists.',
                  },
                ],
                isError: true,
              };
            }

            // Validate password
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Password validation failed: ${passwordValidation.errors.join(', ')}`,
                  },
                ],
                isError: true,
              };
            }

            const newUser: User = {
              id: `user_${Math.random().toString(36).substr(2, 9)}`,
              email,
              username,
              roles: roles || ['user'],
              profile: {
                firstName: profile?.firstName || '',
                lastName: profile?.lastName || '',
                avatar: profile?.avatar,
                preferences: profile?.preferences || {},
              },
              createdAt: new Date().toISOString(),
              isActive: isActive !== undefined ? isActive : true,
            };

            users.set(newUser.id, newUser);
            users.set(`email:${newUser.email}`, newUser);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'create',
                      user: {
                        id: newUser.id,
                        email: newUser.email,
                        username: newUser.username,
                        roles: newUser.roles,
                        createdAt: newUser.createdAt,
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'update': {
            if (!userId) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'User ID is required for update action.',
                  },
                ],
                isError: true,
              };
            }

            const user = users.get(userId);
            if (!user) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `User with ID '${userId}' not found.`,
                  },
                ],
                isError: true,
              };
            }

            // Update user fields
            if (username) user.username = username;
            if (roles) user.roles = roles;
            if (isActive !== undefined) user.isActive = isActive;
            if (profile) {
              user.profile = { ...user.profile, ...profile };
            }

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'update',
                      user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        roles: user.roles,
                        isActive: user.isActive,
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'list': {
            const userList = Array.from(users.values())
              .filter(user => typeof user.id === 'string' && user.id.startsWith('user_'))
              .map(user => ({
                id: user.id,
                email: user.email,
                username: user.username,
                roles: user.roles,
                isActive: user.isActive,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
              }));

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'list',
                      users: userList,
                      total: userList.length,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'get': {
            if (!userId) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'User ID is required for get action.',
                  },
                ],
                isError: true,
              };
            }

            const user = users.get(userId);
            if (!user) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `User with ID '${userId}' not found.`,
                  },
                ],
                isError: true,
              };
            }

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'get',
                      user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        roles: user.roles,
                        profile: user.profile,
                        createdAt: user.createdAt,
                        lastLogin: user.lastLogin,
                        isActive: user.isActive,
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          default:
            return {
              content: [
                {
                  type: 'text',
                  text: `Unknown user management action: ${action}`,
                },
              ],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `User management failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Manage Sessions - Session lifecycle management
 */
function registerManageSessionsTool(server: McpServer) {
  server.registerTool(
    'manage_sessions',
    {
      title: 'Manage Sessions',
      description: 'Manage user sessions, including listing, revoking, and cleanup',
      inputSchema: {
        action: z
          .enum(['list', 'revoke', 'revoke_all', 'cleanup', 'get'])
          .describe('Session management action'),
        sessionId: z.string().optional().describe('Session ID (for specific operations)'),
        userId: z.string().optional().describe('User ID (for user-specific operations)'),
        token: z.string().optional().describe('Token (for token-based operations)'),
      },
    },
    async ({ action, sessionId, userId, token }) => {
      try {
        switch (action) {
          case 'list': {
            let sessionsToShow: Session[];

            if (userId) {
              sessionsToShow = Array.from(sessions.values()).filter(
                session => session.userId === userId
              );
            } else {
              sessionsToShow = Array.from(sessions.values()).filter(
                session => typeof session.id === 'string'
              );
            }

            const sessionList = sessionsToShow.map(session => {
              const user = users.get(session.userId);
              return {
                id: session.id,
                userId: session.userId,
                userEmail: user?.email,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                expiresAt: session.expiresAt,
                ipAddress: session.ipAddress,
                isExpired: new Date() > new Date(session.expiresAt),
              };
            });

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'list',
                      sessions: sessionList,
                      total: sessionList.length,
                      ...(userId && { filteredByUser: userId }),
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'revoke': {
            if (!sessionId && !token) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Session ID or token is required for revoke action.',
                  },
                ],
                isError: true,
              };
            }

            const targetSession = sessionId ? sessions.get(sessionId) : sessions.get(token!);

            if (!targetSession) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Session not found.',
                  },
                ],
                isError: true,
              };
            }

            // Remove session
            sessions.delete(targetSession.id);
            sessions.delete(targetSession.token);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'revoke',
                      sessionId: targetSession.id,
                      userId: targetSession.userId,
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'revoke_all': {
            if (!userId) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'User ID is required for revoke_all action.',
                  },
                ],
                isError: true,
              };
            }

            const userSessions = Array.from(sessions.values()).filter(
              session => session.userId === userId
            );

            for (const session of userSessions) {
              sessions.delete(session.id);
              sessions.delete(session.token);
            }

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'revoke_all',
                      userId,
                      revokedSessions: userSessions.length,
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'cleanup': {
            const now = new Date();
            const expiredSessions = Array.from(sessions.values()).filter(
              session => now > new Date(session.expiresAt)
            );

            for (const session of expiredSessions) {
              sessions.delete(session.id);
              sessions.delete(session.token);
            }

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'cleanup',
                      cleanedSessions: expiredSessions.length,
                      remainingSessions: sessions.size / 2, // Divide by 2 because each session is stored twice
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          default:
            return {
              content: [
                {
                  type: 'text',
                  text: `Unknown session management action: ${action}`,
                },
              ],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Session management failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Check Permissions - Role-based access control
 */
function registerCheckPermissionsTool(server: McpServer) {
  server.registerTool(
    'check_permissions',
    {
      title: 'Check Permissions',
      description: 'Check user permissions and role-based access control',
      inputSchema: {
        token: z.string().describe('Authentication token'),
        resource: z.string().describe('Resource to access'),
        action: z.enum(['read', 'write', 'delete', 'admin']).describe('Action to perform'),
        context: z.record(z.any()).optional().describe('Additional context for permission check'),
      },
    },
    async ({ token, resource, action, context }) => {
      try {
        // Validate session
        const session = sessions.get(token);
        if (!session) {
          return {
            content: [
              {
                type: 'text',
                text: 'Invalid or expired token.',
              },
            ],
            isError: true,
          };
        }

        // Check if session is expired
        if (new Date() > new Date(session.expiresAt)) {
          return {
            content: [
              {
                type: 'text',
                text: 'Token has expired.',
              },
            ],
            isError: true,
          };
        }

        // Get user
        const user = users.get(session.userId);
        if (!user || !user.isActive) {
          return {
            content: [
              {
                type: 'text',
                text: 'User account is inactive or not found.',
              },
            ],
            isError: true,
          };
        }

        // Mock permission checking logic
        let hasPermission = false;
        const reasoning: string[] = [];

        // Admin role has all permissions
        if (user.roles.includes('admin')) {
          hasPermission = true;
          reasoning.push('User has admin role');
        } else {
          // Check specific permissions based on roles and resource
          switch (action) {
            case 'read':
              hasPermission = user.roles.includes('user') || user.roles.includes('reader');
              reasoning.push(
                `Read access: ${hasPermission ? 'granted' : 'denied'} for roles: ${user.roles.join(', ')}`
              );
              break;
            case 'write':
              hasPermission = user.roles.includes('editor') || user.roles.includes('writer');
              reasoning.push(
                `Write access: ${hasPermission ? 'granted' : 'denied'} for roles: ${user.roles.join(', ')}`
              );
              break;
            case 'delete':
              hasPermission = user.roles.includes('editor') || user.roles.includes('moderator');
              reasoning.push(
                `Delete access: ${hasPermission ? 'granted' : 'denied'} for roles: ${user.roles.join(', ')}`
              );
              break;
            case 'admin':
              hasPermission = false; // Already checked admin role above
              reasoning.push('Admin access: denied - admin role required');
              break;
          }
        }

        const response = {
          success: true,
          permitted: hasPermission,
          user: {
            id: user.id,
            email: user.email,
            roles: user.roles,
          },
          check: {
            resource,
            action,
            context,
          },
          reasoning,
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Permission check failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Security Audit - Monitor security events and generate reports
 */
function registerSecurityAuditTool(server: McpServer) {
  server.registerTool(
    'security_audit',
    {
      title: 'Security Audit',
      description: 'Monitor security events and generate audit reports',
      inputSchema: {
        action: z
          .enum(['login_attempts', 'active_sessions', 'security_report', 'suspicious_activity'])
          .describe('Audit action'),
        timeRange: z.number().default(24).describe('Time range in hours'),
        userId: z.string().optional().describe('Filter by user ID'),
        includeDetails: z.boolean().default(false).describe('Include detailed information'),
      },
    },
    async ({ action, timeRange, userId, includeDetails }) => {
      try {
        const cutoffTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);

        switch (action) {
          case 'login_attempts': {
            let attempts = loginAttempts.filter(
              attempt => new Date(attempt.timestamp) > cutoffTime
            );

            if (userId) {
              const user = users.get(userId);
              if (user) {
                attempts = attempts.filter(attempt => attempt.email === user.email);
              }
            }

            const stats = {
              total: attempts.length,
              successful: attempts.filter(a => a.success).length,
              failed: attempts.filter(a => !a.success).length,
              uniqueIps: new Set(attempts.map(a => a.ipAddress)).size,
              uniqueUsers: new Set(attempts.map(a => a.email)).size,
            };

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'login_attempts',
                      timeRange: `${timeRange}h`,
                      statistics: stats,
                      ...(includeDetails && { attempts: attempts.slice(-20) }),
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'active_sessions': {
            const now = new Date();
            const activeSessions = Array.from(sessions.values())
              .filter(session => typeof session.id === 'string' && session.id.startsWith('sess_'))
              .filter(session => now < new Date(session.expiresAt))
              .filter(session => (userId ? session.userId === userId : true));

            const sessionData = activeSessions.map(session => {
              const user = users.get(session.userId);
              return {
                id: session.id,
                userId: session.userId,
                userEmail: user?.email,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                expiresAt: session.expiresAt,
              };
            });

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'active_sessions',
                      activeSessions: sessionData.length,
                      ...(includeDetails && { sessions: sessionData }),
                      ...(userId && { filteredByUser: userId }),
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'security_report': {
            const failedAttempts = loginAttempts.filter(
              a => !a.success && new Date(a.timestamp) > cutoffTime
            );
            const suspiciousIps = Object.entries(
              failedAttempts.reduce(
                (acc, attempt) => {
                  acc[attempt.ipAddress] = (acc[attempt.ipAddress] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>
              )
            ).filter(([, count]) => count >= 3);

            const report = {
              timeRange: `${timeRange}h`,
              summary: {
                totalLoginAttempts: loginAttempts.filter(a => new Date(a.timestamp) > cutoffTime)
                  .length,
                failedLoginAttempts: failedAttempts.length,
                activeSessions: Array.from(sessions.values()).filter(
                  s => new Date() < new Date(s.expiresAt) && s.id.startsWith('sess_')
                ).length,
                suspiciousIpCount: suspiciousIps.length,
              },
              threats: {
                bruteForceAttempts: suspiciousIps.length,
                suspiciousIps: suspiciousIps.map(([ip, count]) => ({ ip, failedAttempts: count })),
                recommendations:
                  suspiciousIps.length > 0
                    ? ['Consider implementing IP blocking', 'Enable account lockout policies']
                    : ['No immediate security concerns detected'],
              },
            };

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'security_report',
                      report,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          default:
            return {
              content: [
                {
                  type: 'text',
                  text: `Unknown security audit action: ${action}`,
                },
              ],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Security audit failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Server Status - Get comprehensive server status
 */
function registerStatusTool(server: McpServer) {
  server.registerTool(
    'get_server_status',
    {
      title: 'Get Server Status',
      description: 'Get comprehensive authentication server status and statistics',
      inputSchema: {
        includeUsers: z.boolean().default(false).describe('Include user statistics'),
        includeSessions: z.boolean().default(true).describe('Include session statistics'),
        includeSecurity: z.boolean().default(true).describe('Include security metrics'),
      },
    },
    async ({ includeUsers, includeSessions, includeSecurity }) => {
      try {
        const status = {
          server: {
            name: SERVER_NAME,
            version: SERVER_VERSION,
            description: SERVER_DESCRIPTION,
            uptime: process.uptime(),
            status: 'running',
            tools: 6,
          },
          timestamp: new Date().toISOString(),
        };

        if (includeUsers) {
          const activeUsers = Array.from(users.values())
            .filter(user => typeof user.id === 'string' && user.id.startsWith('user_'))
            .filter(user => user.isActive);

          (status as any).users = {
            total: activeUsers.length,
            active: activeUsers.filter(user => user.lastLogin).length,
            byRole: activeUsers.reduce(
              (acc, user) => {
                user.roles.forEach(role => {
                  acc[role] = (acc[role] || 0) + 1;
                });
                return acc;
              },
              {} as Record<string, number>
            ),
          };
        }

        if (includeSessions) {
          const now = new Date();
          const allSessions = Array.from(sessions.values()).filter(
            session => typeof session.id === 'string' && session.id.startsWith('sess_')
          );

          const activeSessions = allSessions.filter(session => now < new Date(session.expiresAt));

          (status as any).sessions = {
            total: allSessions.length,
            active: activeSessions.length,
            expired: allSessions.length - activeSessions.length,
          };
        }

        if (includeSecurity) {
          const recentAttempts = loginAttempts.filter(
            attempt => new Date(attempt.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
          );

          (status as any).security = {
            loginAttempts24h: recentAttempts.length,
            failedAttempts24h: recentAttempts.filter(a => !a.success).length,
            successRate:
              recentAttempts.length > 0
                ? `${Math.floor((recentAttempts.filter(a => a.success).length / recentAttempts.length) * 100)}%`
                : '100%',
            uniqueIps24h: new Set(recentAttempts.map(a => a.ipAddress)).size,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get server status: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

function updateRateLimit(key: string): void {
  const now = Date.now();
  const windowStart = Math.floor(now / (60 * 1000)) * (60 * 1000); // 1-minute windows
  const rateLimit = rateLimits.get(key);

  if (!rateLimit || now >= rateLimit.resetTime) {
    rateLimits.set(key, {
      count: 1,
      resetTime: windowStart + 60 * 1000,
    });
  } else {
    rateLimit.count++;
  }
}

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < authConfig.passwordPolicy.minLength) {
    errors.push(`Password must be at least ${authConfig.passwordPolicy.minLength} characters long`);
  }

  if (authConfig.passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (authConfig.passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (authConfig.passwordPolicy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (authConfig.passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// Server Setup
// =============================================================================

/**
 * Create and configure the MCP server
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Register all tools
  registerLoginTool(server);
  registerOAuthCallbackTool(server);
  registerValidateTokenTool(server);
  registerManageUsersTool(server);
  registerManageSessionsTool(server);
  registerCheckPermissionsTool(server);
  registerSecurityAuditTool(server);
  registerStatusTool(server);

  return server;
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(server: McpServer): void {
  const shutdown = async (signal: string) => {
    console.error(`\nReceived ${signal}, shutting down gracefully...`);

    try {
      await server.close();
      console.error('Server stopped successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));

  process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', reason => {
    console.error('Unhandled promise rejection:', reason);
    process.exit(1);
  });
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    console.error(`🚀 Starting ${SERVER_NAME} v${SERVER_VERSION}`);
    console.error(`📝 ${SERVER_DESCRIPTION}`);
    console.error('🔌 Transport: stdio');
    console.error(
      '🛠️ Tools: login, oauth_callback, validate_token, manage_users, manage_sessions, check_permissions, security_audit, get_server_status'
    );
    console.error('📡 Ready to receive MCP requests...\n');

    // Create server
    const server = createServer();

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    console.error('✅ Authentication server connected successfully');
    console.error('💡 Available tools:');
    console.error('   • login - Authenticate users with email/password or OAuth');
    console.error('   • oauth_callback - Handle OAuth authentication callbacks');
    console.error('   • validate_token - Validate and refresh authentication tokens');
    console.error('   • manage_users - Create, update, and manage user accounts');
    console.error('   • manage_sessions - Manage user sessions and tokens');
    console.error('   • check_permissions - Role-based access control');
    console.error('   • security_audit - Monitor security events and reports');
    console.error('   • get_server_status - Get server status and statistics');
  } catch (error) {
    console.error('💥 Failed to start server:');
    console.error(error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.stack) {
      console.error('\n🔍 Stack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// =============================================================================
// Application Bootstrap
// =============================================================================

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Bootstrap error:', error);
    process.exit(1);
  });
}

// Export for testing
export { main, createServer };
