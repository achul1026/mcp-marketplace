export type Env = {
  DB: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  JWT_SECRET: string;
  APP_URL: string;
  ENVIRONMENT: string;
};

export type User = {
  id: string;
  github_id: number;
  github_login: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Server = {
  id: string;
  name: string;
  description: string;
  category: Category;
  github_url: string;
  install_command: string;
  readme_url: string | null;
  author_id: string;
  author_login: string;
  price: number;
  is_approved: number;
  download_count: number;
  version: string;
  last_verified_at: string | null;
  verify_status: 'ok' | 'failed' | null;
  gh_stars: number | null;
  gh_license: string | null;
  gh_last_commit: string | null;
  gh_has_readme: number | null;
  gh_readme_length: number | null;
  risk_score: number | null;
  risk_signals: string | null;
  created_at: string;
  updated_at: string;
};

export type Category =
  | 'productivity'
  | 'data'
  | 'developer'
  | 'ai'
  | 'communication'
  | 'other';

export const CATEGORY_LABELS: Record<Category, string> = {
  productivity: 'Productivity',
  data: 'Data',
  developer: 'Developer Tools',
  ai: 'AI',
  communication: 'Communication',
  other: 'Other',
};

export type Review = {
  id: string;
  user_id: string;
  server_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  github_login?: string;
};

export type JwtPayload = {
  sub: string;
  login: string;
  avatar: string;
  exp: number;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  author_id: string;
  author_login: string;
  created_at: string;
  updated_at: string;
};
