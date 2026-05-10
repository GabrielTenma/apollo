import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './strategies/jwt.strategy';

export interface UserRoles {
  id: string;
  email: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates a JWT access token with user roles.
   *
   * @param user - The user object containing id, email, and roles
   * @param expiresIn - Token expiration time (e.g., '60m', '1h', '7d')
   *                     If not provided, uses JWT_ACCESS_EXPIRATION from env
   * @returns The signed JWT token
   *
   * @example
   * // Time-based expiration (60 minutes)
   * const token = generateAccessToken(user, '60m');
   *
   * // Non-time-based (no expiration)
   * const token = generateAccessToken(user, null); // or undefined
   */
  generateAccessToken(user: UserRoles, expiresIn?: string | null): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const options: { expiresIn?: string | number } = {};

    // If expiresIn is explicitly null or undefined, token won't have expiration
    if (expiresIn !== null && expiresIn !== undefined) {
      options.expiresIn = expiresIn;
    } else if (expiresIn === undefined) {
      // Use default from env if not specified
      const defaultExpiration = this.configService.get<string>(
        'JWT_ACCESS_EXPIRATION',
        '60m',
      );
      options.expiresIn = defaultExpiration;
    }
    // If expiresIn is null, token has no expiration (non-time-based)

    return this.jwtService.sign(payload, options);
  }

  /**
   * Generates a refresh token for token renewal.
   * Refresh tokens typically have longer expiration times.
   *
   * @param user - The user object
   * @param expiresIn - Refresh token expiration (default: 7d from env)
   * @returns The refresh token
   */
  generateRefreshToken(user: UserRoles, expiresIn?: string): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: [], // Refresh tokens don't need roles
    };

    const refreshExpiration =
      expiresIn ||
      this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');

    return this.jwtService.sign(payload, { expiresIn: refreshExpiration });
  }

  /**
   * Validates a refresh token and returns a new access token.
   *
   * @param refreshToken - The refresh token to validate
   * @returns New access token and refresh token pair
   * @throws UnauthorizedException if refresh token is invalid
   */
  refreshTokens(refreshToken: string): {
    accessToken: string;
    refreshToken: string;
  } {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);

      const user: UserRoles = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || [],
      };

      return {
        accessToken: this.generateAccessToken(user),
        refreshToken: this.generateRefreshToken(user),
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
