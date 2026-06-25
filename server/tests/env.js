// Runs before any module (incl. config/env) is imported.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_characters_long_xxxxx';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long_x';
