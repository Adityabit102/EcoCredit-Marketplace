import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../services/api';

// Types
export interface User {
  _id: string;
  email: string;
  name: string;
  accountType: 'individual' | 'business';
  walletAddress?: string;
  joinedDate?: string;
  plan?: string;
  role?: string;
}

export interface CreditTransaction {
  _id: string;
  id?: string;
  type: 'earned' | 'bought' | 'sold';
  credits: number;
  amount?: number;
  co2Offset: number;
  date?: string;
  createdAt?: string;
  status: 'completed' | 'pending' | 'failed' | 'verified';
  description: string;
  buyer?: any;
  seller?: any;
  listing?: any;
  location?: string;
  blockchainHash?: string;
}

export interface CreditListing {
  _id: string;
  id?: string;
  title: string;
  seller: {
    _id: string;
    name: string;
    avatar?: string;
    rating?: number;
  };
  price: number;
  co2Offset: number;
  credits: number;
  location: string;
  date?: string;
  createdAt?: string;
  verified?: boolean;
  image?: string;
  imageUrl?: string;
  type: string;
  description?: string;
  active: boolean;
}

export interface EcoAction {
  _id: string;
  id?: string;
  date?: string;
  createdAt?: string;
  action?: string;
  description?: string;
  type: string;
  co2Offset: number;
  credits: number;
  status: 'verified' | 'pending' | 'rejected';
  location: string;
  blockchainHash?: string;
  verification?: {
    aiScore: number;
    geoVerified: boolean;
    imageAnalysis: string;
    verifier?: string;
  };
  image?: string;
  imageUrl?: string;
}

interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  transactions: CreditTransaction[];
  listings: CreditListing[];
  actions: EcoAction[];
  currentPage: string;
  loading: boolean;
  error: string | null;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    timestamp: Date;
  }>;
}

type AppAction =
  | { type: 'SET_PAGE'; payload: string }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_DATA'; payload: { transactions?: any[], listings?: any[], actions?: any[] } }
  | { type: 'ADD_TRANSACTION'; payload: CreditTransaction }
  | { type: 'ADD_LISTING'; payload: CreditListing }
  | { type: 'REMOVE_LISTING'; payload: string }
  | { type: 'ADD_ACTION'; payload: EcoAction }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_NOTIFICATION'; payload: { type: 'success' | 'error' | 'info' | 'warning'; message: string } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_WALLET'; payload: string }
  | { type: 'PURCHASE_CREDITS'; payload: { listingId: string; amount: number; transaction: any, remaining: number } };

const initialState: AppState = {
  isAuthenticated: false,
  user: null,
  transactions: [],
  listings: [],
  actions: [],
  currentPage: 'about',
  loading: false,
  error: null,
  notifications: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        currentPage: 'home',
      };
    case 'LOGOUT':
      return {
        ...initialState,
        listings: state.listings, // Keep public listings
        currentPage: 'login'
      };
    case 'SET_DATA':
      return {
        ...state,
        ...(action.payload.transactions && { transactions: action.payload.transactions }),
        ...(action.payload.listings && { listings: action.payload.listings }),
        ...(action.payload.actions && { actions: action.payload.actions }),
      };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'ADD_LISTING':
      return { ...state, listings: [action.payload, ...state.listings] };
    case 'REMOVE_LISTING':
      return { ...state, listings: state.listings.filter(l => l._id !== action.payload && l.id !== action.payload) };
    case 'ADD_ACTION':
      return { ...state, actions: [action.payload, ...state.actions] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [{
          id: Date.now().toString() + Math.random(),
          type: action.payload.type,
          message: action.payload.message,
          timestamp: new Date()
        }, ...state.notifications]
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    case 'UPDATE_WALLET':
      return {
        ...state,
        user: state.user ? { ...state.user, walletAddress: action.payload } : null
      };
    case 'PURCHASE_CREDITS':
      return {
        ...state,
        transactions: [action.payload.transaction, ...state.transactions],
        listings: action.payload.remaining <= 0 
          ? state.listings.filter(l => (l._id || l.id) !== action.payload.listingId)
          : state.listings.map(l => (l._id || l.id) === action.payload.listingId ? { ...l, credits: action.payload.remaining } : l)
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  refreshDashboard: () => Promise<void>;
  refreshListings: () => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const refreshDashboard = async () => {
    // guard on the token (read fresh) not state.isAuthenticated — during bootstrap the
    // LOGIN dispatch hasn't flushed yet, so the stale closure value would skip the load
    if (!localStorage.getItem('ecocredit_access_token')) return;
    try {
      const data = await api.users.dashboard();
      dispatch({ 
        type: 'SET_DATA', 
        payload: { 
          transactions: data.transactions.map((t:any) => ({...t, id: t._id, date: t.createdAt})), 
          actions: data.actions.map((a:any) => ({...a, id: a._id, date: a.createdAt, description: a.description || a.action})) 
        } 
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  const refreshListings = async () => {
    try {
      const data = await api.listings.list();
      dispatch({ 
        type: 'SET_DATA', 
        payload: { 
          listings: data.listings.map((l:any) => ({...l, id: l._id, date: l.createdAt, image: l.imageUrl || 'https://images.unsplash.com/photo-1655300256486-4ec7251bf84e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'})) 
        } 
      });
    } catch (err) {
      console.error('Failed to load listings:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('ecocredit_access_token');
      if (token) {
        try {
          const user = await api.auth.me();
          dispatch({ type: 'LOGIN', payload: user });
          refreshDashboard();
        } catch (err) {
          localStorage.removeItem('ecocredit_access_token');
          localStorage.removeItem('ecocredit_refresh_token');
        }
      }
      refreshListings();
    };

    initAuth();

    // Listen for global auth expiration
    const handleAuthExpired = () => {
      dispatch({ type: 'LOGOUT' });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'warning', message: 'Session expired. Please log in again.' } });
    };

    window.addEventListener('auth_expired', handleAuthExpired);
    return () => window.removeEventListener('auth_expired', handleAuthExpired);
  }, []);

  // Notifications auto-remove
  useEffect(() => {
    if (state.notifications.length > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: state.notifications[0].id });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.notifications]);

  return (
    <AppContext.Provider value={{ state, dispatch, refreshDashboard, refreshListings }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}