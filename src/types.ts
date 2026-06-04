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
  created_at: string;
  updated_at: string;
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

export type Category =
  | 'productivity'
  | 'data'
  | 'developer'
  | 'ai'
  | 'communication'
  | 'other';

export const CATEGORY_LABELS: Record<Category, string> = {
  productivity: '생산성',
  data: '데이터',
  developer: '개발자 도구',
  ai: 'AI',
  communication: '커뮤니케이션',
  other: '기타',
};

export type JwtPayload = {
  sub: string;
  login: string;
  avatar: string;
  exp: number;
};
