'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/lib/notification';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, ChevronRight, CheckCircle, AlertCircle, Shield, ServerIcon, KeyIcon, LinkIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Types for broker information
type BrokerCredential = {
  id: string;
  user_id: string;
  broker_name: string;
  credentials: Record<string, string>;
  is_active: boolean;
  created_at: string;
};

type AvailableBrokerConfig = {
  name: string;
  fields: string[];
};

// List of available brokers with their required fields
const AVAILABLE_BROKERS: AvailableBrokerConfig[] = [
  { name: 'Alice Blue', fields: ['User ID', 'API Key', 'Secret Key'] },
  { name: 'Angel One', fields: ['Client ID', 'API Key'] },
  { name: 'Angel Broking', fields: ['API Key', 'Secret Key'] },
  { name: 'Binance', fields: ['App Key', 'Secret Key'] },
  { name: 'Delta Exchange', fields: ['API Key', 'Secret Key'] },
  { name: 'Dhan', fields: ['Client ID', 'Access Token'] },
  { name: 'Finvasia', fields: ['User ID', 'Password', 'Vendor Code', 'API Key', '2FA'] },
  { name: 'Fyers', fields: ['App ID', 'Secret Key'] },
  { name: 'ICICI Direct', fields: ['User ID', 'API Key', 'Secret Key', 'DOB', 'Password'] },
  { name: 'IIFL', fields: ['Interactive API Key', 'Interactive Secret Key', 'Market API Key', 'Secret Key'] },
  { name: 'Kotak Neo', fields: ['Consumer Key', 'Secret Key', 'Access Token', 'Mobile No.', 'Password', 'MPIN'] },
  { name: 'MetaTrader 4', fields: ['User ID', 'Password', 'Host', 'Port'] },
  { name: 'MetaTrader 5', fields: ['User ID', 'Password', 'Host', 'Port'] },
  { name: 'Upstox', fields: ['API Key', 'Secret Key'] },
  { name: 'Zerodha', fields: ['API Key', 'Secret Key'] },
];

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

export default function BrokerAuthContent() {
  const [savedBrokers, setSavedBrokers] = useState<BrokerCredential[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<AvailableBrokerConfig | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<BrokerCredential | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBrokers, setLoadingBrokers] = useState<string[]>([]);
  const { showNotification } = useNotification();

  // Fetch saved brokers on component mount
  useEffect(() => {
    fetchSavedBrokers();
  }, []);

  // Handle Upstox OAuth callback completion
  useEffect(() => {
    const handleUpstoxAuthCallback = async (event: MessageEvent) => {
      // Ensure we only handle messages from our own domain
      if (event.origin !== window.location.origin) return;
      
      // Check if this is an Upstox auth success message
      if (event.data && event.data.type === 'UPSTOX_AUTH_SUCCESS') {
        // Get the broker ID from localStorage
        const brokerId = localStorage.getItem('upstox_auth_broker_id');
        
        if (!brokerId) {
          showNotification({
            title: 'UPSTOX_AUTH_ERROR',
            description: 'Authentication failed: Unable to identify broker.',
            type: 'error',
            duration: 5000
          });
          return;
        }
        
        // Clear the broker ID from localStorage
        localStorage.removeItem('upstox_auth_broker_id');
        
        // Verify the authentication was successful
        const response = await fetch('/api/brokers/upstox/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ broker_id: brokerId }),
        });
        
        if (!response.ok) {
          showNotification({
            title: 'UPSTOX_AUTH_ERROR',
            description: 'Failed to verify authentication.',
            type: 'error',
            duration: 5000
          });
          
          // Set the broker as inactive
          setSavedBrokers(prev => prev.map(b => b.id === brokerId ? { ...b, is_active: false } : b));
          
          // Remove this broker from loading state
          setLoadingBrokers(prev => prev.filter(id => id !== brokerId));
          return;
        }
        
        // Authentication successful
        setSavedBrokers(prev => prev.map(b => b.id === brokerId ? { ...b, is_active: true } : b));
        
        // Create a session for the authenticated broker
        await createOrUpdateSession(brokerId, true);
        
        // Remove this broker from loading state
        setLoadingBrokers(prev => prev.filter(id => id !== brokerId));
        
        showNotification({
          title: 'UPSTOX_AUTH_SUCCESS',
          description: 'Upstox has been successfully connected.',
          type: 'success',
          duration: 5000
        });
      }
      
      // Handle Upstox auth failure
      if (event.data && event.data.type === 'UPSTOX_AUTH_FAILURE') {
        const brokerId = localStorage.getItem('upstox_auth_broker_id');
        
        if (brokerId) {
          // Clear the broker ID from localStorage
          localStorage.removeItem('upstox_auth_broker_id');
          
          // Set the broker as inactive
          setSavedBrokers(prev => prev.map(b => b.id === brokerId ? { ...b, is_active: false } : b));
          
          // Remove this broker from loading state
          setLoadingBrokers(prev => prev.filter(id => id !== brokerId));
        }
        
        showNotification({
          title: 'UPSTOX_AUTH_ERROR',
          description: event.data.error || 'Authentication failed.',
          type: 'error',
          duration: 5000
        });
      }
    };
    
    // Add event listener for message events
    window.addEventListener('message', handleUpstoxAuthCallback);
    
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('message', handleUpstoxAuthCallback);
    };
  }, []);

  // Handle Fyers OAuth callback completion
  useEffect(() => {
    const handleFyersAuthCallback = async (event: MessageEvent) => {
      // Ensure we only handle messages from our own domain
      if (event.origin !== window.location.origin) return;
      
      // Check if this is an Fyers auth success message
      if (event.data && event.data.type === 'FYERS_AUTH_SUCCESS') {
        // Get the broker ID from localStorage
        const brokerId = localStorage.getItem('fyers_auth_broker_id');
        
        if (!brokerId) {
          showNotification({
            title: 'FYERS_AUTH_ERROR',
            description: 'Authentication failed: Unable to identify broker.',
            type: 'error',
            duration: 5000
          });
          return;
        }
        
        // Clear the broker ID from localStorage
        localStorage.removeItem('fyers_auth_broker_id');
        
        // Verify the authentication was successful
        const response = await fetch('/api/brokers/fyers/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ broker_id: brokerId }),
        });
        
        if (!response.ok) {
          showNotification({
            title: 'FYERS_AUTH_ERROR',
            description: 'Failed to verify authentication.',
            type: 'error',
            duration: 5000
          });
          
          // Set the broker as inactive
          setSavedBrokers(prev => prev.map(b => b.id === brokerId ? { ...b, is_active: false } : b));
          
          // Remove this broker from loading state
          setLoadingBrokers(prev => prev.filter(id => id !== brokerId));
          return;
        }
        
        // Authentication successful
        setSavedBrokers(prev => prev.map(b => b.id === brokerId ? { ...b, is_active: true } : b));
        
        // Create a session for the authenticated broker
        await createOrUpdateSession(brokerId, true);
        
        // Remove this broker from loading state
        setLoadingBrokers(prev => prev.filter(id => id !== brokerId));
        
        showNotification({
          title: 'FYERS_AUTH_SUCCESS',
          description: 'Fyers has been successfully connected.',
          type: 'success',
          duration: 5000
        });
      }
      
      // Handle Fyers auth failure
      if (event.data && event.data.type === 'FYERS_AUTH_FAILURE') {
        const brokerId = localStorage.getItem('fyers_auth_broker_id');
        
        if (brokerId) {
          // Clear the broker ID from localStorage
          localStorage.removeItem('fyers_auth_broker_id');
          
          // Set the broker as inactive
          setSavedBrokers(prev => prev.map(b => b.id === brokerId ? { ...b, is_active: false } : b));
          
          // Remove this broker from loading state
          setLoadingBrokers(prev => prev.filter(id => id !== brokerId));
        }
        
        showNotification({
          title: 'FYERS_AUTH_ERROR',
          description: event.data.error || 'Authentication failed.',
          type: 'error',
          duration: 5000
        });
      }
    };
    
    // Add event listener for message events
    window.addEventListener('message', handleFyersAuthCallback);
    
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('message', handleFyersAuthCallback);
    };
  }, []);

  const fetchSavedBrokers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/brokers');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch brokers');
      }
      
      const data = await response.json();
      setSavedBrokers(data || []);
    } catch (error: any) {
      showNotification({
        title: 'BROKER_FETCH_ERROR',
        description: 'Unable to retrieve your saved broker connections. Please try again later.',
        type: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBroker = async (broker: BrokerCredential) => {
    try {
      const newStatus = !broker.is_active;
      
      // Start loading state for this specific broker
      setLoadingBrokers(prev => [...prev, broker.id]);
      
      // For AngelOne broker, use specialized authentication endpoints
      if (broker.broker_name === 'Angel One') {
        if (newStatus) {
          // Attempting to activate AngelOne broker - needs authentication
          const response = await fetch('/api/brokers/angelone/authenticate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ broker_id: broker.id }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            // Toggle automatically reverts to OFF on auth failure
            setSavedBrokers(prev => prev.map(b => b.id === broker.id ? { ...b, is_active: false } : b));
            
            // Show error notification
            showNotification({
              title: 'Login denied by AngelOne',
              description: `${errorData.details?.message || errorData.details?.error || errorData.error || 'Authentication failed'} 
              ${errorData.status ? `(Status: ${errorData.status} ${errorData.statusText})` : ''}
              ${errorData.endpoint ? `Endpoint: ${errorData.endpoint}` : ''}`,
              type: 'error',
            });
            
            // Remove this broker from loading state
            setLoadingBrokers(prev => prev.filter(id => id !== broker.id));
            return;
          }
          
          // Authentication successful
          setSavedBrokers(prev => prev.map(b => b.id === broker.id ? { ...b, is_active: true } : b));
          
          showNotification({
            title: 'AngelOne broker authenticated successfully',
            type: 'success',
          });
        } else {
          // Deactivating AngelOne broker
          const response = await fetch('/api/brokers/angelone/deactivate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ broker_id: broker.id }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to deactivate broker');
          }
          
          // Broker deactivated successfully
          setSavedBrokers(prev => prev.map(b => b.id === broker.id ? { ...b, is_active: false } : b));
          
          showNotification({
            title: 'AngelOne broker deactivated',
            type: 'success',
          });
        }
        
        // Remove this broker from loading state
        setLoadingBrokers(prev => prev.filter(id => id !== broker.id));
        return;
      }
      
      // For Dhan broker, use specialized authentication endpoints
      if (broker.broker_name === 'Dhan') {
        if (newStatus) {
          // Attempting to activate Dhan broker - needs authentication
          const response = await fetch('/api/brokers/dhan/authenticate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ broker_id: broker.id }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            // Toggle automatically reverts to OFF on auth failure
            setSavedBrokers(prev => prev.map(b => b.id === broker.id ? { ...b, is_active: false } : b));
            
            // Show error notification
            showNotification({
              title: 'DHAN_AUTH_FAILED',
              description: `Broker authentication failed. Please check your credentials and try again.`,
              type: 'error',
              duration: 5000
            });
            
            // Remove this broker from loading state
            setLoadingBrokers(prev => prev.filter(id => id !== broker.id));
            return;
          }
          
          // Authentication successful
          setSavedBrokers(prev => prev.map(b => b.id === broker.id ? { ...b, is_active: true } : b));
          
          showNotification({
            title: 'DHAN_AUTH_SUCCESS',
            description: 'Your Dhan broker connection is now active and ready to use.',
            type: 'success',
            duration: 3000
          });

          // Create a session for the authenticated broker
          await createOrUpdateSession(broker.id, true);
        } else {
          // Deactivating Dhan broker
          const response = await fetch('/api/brokers/dhan/deactivate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ broker_id: broker.id }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to deactivate broker');
          }
          
          // Broker deactivated successfully
          setSavedBrokers(prev => prev.map(b => b.id === broker.id ? { ...b, is_active: false } : b));
          
          showNotification({
            title: 'DHAN_DEACTIVATED',
            description: 'Your Dhan broker connection has been deactivated successfully.',
            type: 'success',
            duration: 3000
          });

          // Deactivate the session for this broker
          await createOrUpdateSession(broker.id, false);
        }
        
        // Remove this broker from loading state
        setLoadingBrokers(prev => prev.filter(id => id !== broker.id));
        return;
      }
      
      // For Upstox broker, use specialized OAuth authentication
      if (broker.broker_name === 'Upstox') {
        if (newStatus) {
          // Attempting to activate Upstox broker - needs OAuth authentication
          const response = await fetch('/api/brokers/upstox/oauth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ broker_id: broker.id }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            // Toggle automatically reverts to OFF on auth failure
            setSavedBrokers(prev => prev.map(b => b.id === broker.id ? { ...b, is_active: false } : b));
            
            // Show error notification
            showNotification({
              title: 'UPSTOX_AUTH_FAILED',
              description: `Broker authentication failed. Please check your credentials and try again.`,
              type: 'error',
              duration: 5000
            });
            
            // Remove this broker from loading state
            setLoadingBrokers(prev => prev.filter(id => id !== broker.id));
            return;
          }
          
          // If the response is successful, we should get a URL to redirect to
          const data = await response.json();
          
          if (data.redirect_url) {
            // Open the Upstox authorization page in a new window
            const authWindow = window.open(data.redirect_url, 'UpstoxAuth', 'width=600,height=700');
            
            // Save the broker ID to localStorage to retrieve it when the OAuth callback returns
            localStorage.setItem('upstox_auth_broker_id', broker.id);
            
            // The rest of the authentication will be handled by the callback endpoint
            // Keep this broker in loading state until callback resolves
            return;
          }
          
          // If we get here, something went wrong
          setSavedBrokers(prev => prev.map(b => b.id === broker.id ? { ...b, is_active: false } : b));
          showNotification({
            title: 'UPSTOX_AUTH_ERROR',
            description: 'Failed to initiate Upstox OAuth flow.',
            type: 'error',
            duration: 5000
          });
        } else {
          // Deactivating Upstox broker
          const response = await fetch('/api/brokers/upstox/deactivate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ broker_id: broker.id }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to deactivate broker');
          }
          
          // Broker deactivated successfully
          setSavedBrokers(prev => prev.map(b => b.id === broker.id ? { ...b, is_active: false } : b));
          
          showNotification({
            title: 'Upstox broker deactivated',
            type: 'success',
          });
        }
        
        // Remove this broker from loading state
        setLoadingBrokers(prev => prev.filter(id => id !== broker.id));
        return;
      }
      
      // For other brokers, use the general active/inactive toggle endpoint
      const response = await fetch(`/api/brokers/${broker.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newStatus }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update broker status');
      }
      
      // Update local state
      setSavedBrokers(prev => 
        prev.map(b => b.id === broker.id ? { ...b, is_active: newStatus } : b)
      );
      
      showNotification({
        title: newStatus ? 'BROKER_ACTIVATED' : 'BROKER_DEACTIVATED',
        type: 'success',
        duration: 3000
      });

      // Create or deactivate session based on new status
      await createOrUpdateSession(broker.id, newStatus);
      
      // Remove this broker from loading state
      setLoadingBrokers(prev => prev.filter(id => id !== broker.id));
    } catch (error: any) {
      // Remove this broker from loading state on error
      setLoadingBrokers(prev => prev.filter(id => id !== broker.id));
      
      showNotification({
        title: 'BROKER_TOGGLE_ERROR',
        description: 'Failed to update the broker status. Please try again later.',
        type: 'error',
        duration: 5000
      });
    }
  };

  const createOrUpdateSession = async (brokerId: string, active: boolean) => {
    try {
      const response = await fetch('/api/brokers/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broker_id: brokerId,
          active: active
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to manage broker session');
      }
      
      return true;
    } catch (error: any) {
      console.error('Session management error:', error);
      showNotification({
        title: 'SESSION_ERROR',
        description: 'Unable to manage broker session. Trading functionality may be limited.',
        type: 'error',
        duration: 5000
      });
      return false;
    }
  };

  const handleDeleteBroker = async (broker: BrokerCredential) => {
    try {
      const response = await fetch(`/api/brokers/${broker.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete broker');
      }
      
      // Update local state
      setSavedBrokers(prev => prev.filter(b => b.id !== broker.id));
      
      showNotification({
        title: 'BROKER_DELETED',
        description: 'The broker connection has been permanently removed from your account.',
        type: 'success',
        duration: 3000
      });
    } catch (error: any) {
      showNotification({
        title: 'DELETE_ERROR',
        description: 'Failed to delete the broker connection. Please try again later.',
        type: 'error',
        duration: 5000
      });
    }
  };

  const openConnectModal = (broker: AvailableBrokerConfig) => {
    setSelectedBroker(broker);
    setFieldValues({});
    setIsConnectModalOpen(true);
  };

  const openEditModal = (broker: BrokerCredential) => {
    setEditingBroker(broker);
    setFieldValues(broker.credentials);
    setIsEditModalOpen(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [field]: value }));
  };

  const handleConnect = async () => {
    if (!selectedBroker) return;
    
    setLoading(true);
    
    try {
      // Validate that all fields have values
      const missingFields = selectedBroker.fields.filter(field => !fieldValues[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }
      
      const response = await fetch('/api/brokers/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broker_name: selectedBroker.name,
          credentials: fieldValues,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect broker');
      }
      
      // Close modal and refresh broker list
      setIsConnectModalOpen(false);
      fetchSavedBrokers();
      
      showNotification({
        title: 'BROKER_SAVED',
        description: 'Broker credentials have been saved successfully. Activate it by toggling the switch.',
        type: 'success',
        duration: 5000
      });
    } catch (error: any) {
      showNotification({
        title: 'CONNECTION_ERROR',
        description: error.message || 'Failed to establish broker connection. Please verify your credentials.',
        type: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBroker) return;
    
    setLoading(true);
    
    try {
      // Get the broker config to validate required fields
      const brokerConfig = AVAILABLE_BROKERS.find(b => b.name === editingBroker.broker_name);
      
      if (!brokerConfig) {
        throw new Error('Broker configuration not found');
      }
      
      // Validate that all fields have values
      const missingFields = brokerConfig.fields.filter(field => !fieldValues[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }
      
      const response = await fetch(`/api/brokers/${editingBroker.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentials: fieldValues,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update broker');
      }
      
      // Close modal and refresh broker list
      setIsEditModalOpen(false);
      fetchSavedBrokers();
      
      // If this is a Dhan broker and it's currently active, show a message about toggling
      if (editingBroker.broker_name === 'Dhan' && editingBroker.is_active) {
        showNotification({
          title: 'BROKER_UPDATED',
          description: 'Credentials updated. Please toggle the broker OFF and ON to re-authenticate.',
          type: 'info',
          duration: 7000
        });
      } else {
        showNotification({
          title: 'BROKER_UPDATED',
          description: 'Broker credentials have been updated successfully.',
          type: 'success',
          duration: 3000
        });
      }
    } catch (error: any) {
      showNotification({
        title: 'UPDATE_ERROR',
        description: error.message || 'Failed to update broker credentials. Please try again.',
        type: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section: Connected Brokers */}
      <div>
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
            <ServerIcon className="w-3 h-3 text-white" />
          </div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-white">CONNECTED_BROKERS</h2>
        </div>
        
        <Card className="border border-zinc-900 bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <CardContent className="p-4">
            {savedBrokers.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 text-zinc-500" />
                <p className="text-zinc-500 font-mono text-sm mb-1">NO_BROKERS_CONNECTED</p>
                <p className="text-xs text-zinc-600 mb-4">Connect to trading brokers to enable automated trading</p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsConnectModalOpen(true)}
                  className="bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white text-xs font-mono"
                >
                  CONNECT_BROKER
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {savedBrokers.map((broker) => (
                  <motion.div
                    key={broker.id}
                    variants={fadeInVariants}
                    initial="hidden"
                    animate="visible"
                    className="p-3 border border-zinc-900 rounded bg-zinc-900/30 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center p-1.5 rounded bg-zinc-900 border border-zinc-800">
                        <KeyIcon className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white">{broker.broker_name}</h3>
                        <p className="text-xs text-zinc-500 font-mono">CONNECTED: {new Date(broker.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center gap-1 px-2 py-1 border border-zinc-800 rounded-md bg-zinc-900">
                        <div className={`w-2 h-2 rounded-full ${broker.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs font-mono text-zinc-400">{broker.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </div>
                      <Switch 
                        checked={broker.is_active} 
                        onCheckedChange={() => handleToggleBroker(broker)}
                        className={`data-[state=checked]:bg-green-700 data-[state=unchecked]:bg-zinc-700 ${loadingBrokers.includes(broker.id) ? 'opacity-50' : ''}`}
                        disabled={loadingBrokers.includes(broker.id)}
                      />
                      {loadingBrokers.includes(broker.id) && (
                        <div className="w-4 h-4 border-2 border-t-transparent border-zinc-400 rounded-full animate-spin ml-1"></div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(broker)}
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBroker(broker)}
                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsConnectModalOpen(true)}
                    className="bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white text-xs font-mono"
                  >
                    <LinkIcon className="h-3.5 w-3.5 mr-1" /> SAVE_NEW_BROKER
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section: Available Brokers */}
      <div>
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 flex items-center justify-center bg-zinc-950 border border-zinc-900 mr-2">
            <LinkIcon className="w-3 h-3 text-white" />
          </div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-white">AVAILABLE_BROKERS</h2>
        </div>
        
        <Card className="border border-zinc-900 bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AVAILABLE_BROKERS.map((broker) => (
                <div 
                  key={broker.name}
                  className="p-3 border border-zinc-900 rounded bg-zinc-900/30 hover:bg-zinc-800/30 hover:border-zinc-800 transition-colors cursor-pointer flex flex-col"
                  onClick={() => openConnectModal(broker)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-white">{broker.name}</h3>
                    <ChevronRight className="h-4 w-4 text-zinc-500" />
                  </div>
                  <p className="text-xs text-zinc-500 mb-1 font-mono">FIELDS: {broker.fields.length}</p>
                  <div className="mt-auto pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-xs justify-center font-mono text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      SAVE
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connect Broker Modal */}
      <Dialog
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
      >
        <DialogContent className="bg-black border border-zinc-900 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-mono">
              SAVE {selectedBroker?.name.toUpperCase() || ''}
            </DialogTitle>
            {selectedBroker?.name === 'Dhan' && (
              <DialogDescription className="text-zinc-500 font-mono text-xs mt-2">
                STEP 1: SAVE CREDENTIALS | STEP 2: TOGGLE TO AUTHENTICATE
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-5 py-6">
            {selectedBroker?.fields.map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field} className="text-xs font-mono text-zinc-400">{field.toUpperCase()}</Label>
                <Input
                  id={field}
                  value={fieldValues[field] || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={`Enter ${field}`}
                  className="bg-zinc-900 border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-700 focus:ring-0 font-mono"
                />
              </div>
            ))}
            
            {selectedBroker?.name === 'Dhan' && (
              <div className="p-3 border border-zinc-800 rounded bg-zinc-900/30 text-xs text-zinc-400 mt-4">
                <p>Step 1: Save your Dhan credentials</p>
                <p>Step 2: Toggle ON the broker from Saved Brokers to authenticate</p>
                <p className="text-zinc-500 mt-2">You can get your credentials from web.dhan.co → My Profile → DhanHQ Trading APIs and Access</p>
              </div>
            )}
          </div>
          <DialogFooter className="pt-4 border-t border-zinc-900">
            <Button 
              variant="ghost" 
              onClick={() => setIsConnectModalOpen(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-xs mr-2"
            >
              CANCEL
            </Button>
            <Button 
              onClick={handleConnect} 
              disabled={loading}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-mono text-xs"
            >
              {loading ? 'SAVING...' : selectedBroker?.name === 'Dhan' ? 'SAVE_CREDENTIALS' : 'SAVE'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Broker Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-black border border-zinc-900 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-mono">EDIT {editingBroker?.broker_name.toUpperCase() || ''}</DialogTitle>
            <DialogDescription className="text-zinc-500 font-mono text-xs">
              {editingBroker?.broker_name === 'Dhan' 
                ? 'UPDATE_BROKER_CREDENTIALS | TOGGLE TO RE-AUTHENTICATE' 
                : 'UPDATE_BROKER_CREDENTIALS'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingBroker && AVAILABLE_BROKERS.find(b => b.name === editingBroker.broker_name)?.fields.map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`edit-${field}`} className="text-xs font-mono text-zinc-400">{field.toUpperCase()}</Label>
                <Input
                  id={`edit-${field}`}
                  value={fieldValues[field] || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={`Enter ${field}`}
                  className="bg-zinc-900 border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-700 focus:ring-0 font-mono"
                />
              </div>
            ))}
            
            {editingBroker?.broker_name === 'Dhan' && (
              <div className="p-3 border border-zinc-800 rounded bg-zinc-900/30 text-xs text-zinc-400 mt-4">
                <p>After updating your credentials, you may need to toggle the broker OFF and then ON again to re-authenticate with Dhan.</p>
              </div>
            )}
          </div>
          <DialogFooter className="border-t border-zinc-900 pt-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsEditModalOpen(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-xs"
            >
              CANCEL
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={loading}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-mono text-xs"
            >
              {loading ? 'SAVING...' : 'SAVE_CHANGES'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security Notice */}
      <div className="border border-zinc-900 rounded p-3 bg-zinc-900/20 text-xs flex items-start gap-3">
        <Shield className="h-5 w-5 text-zinc-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-zinc-400 font-mono mb-1">SECURITY_NOTICE</p>
          <p className="text-zinc-500">All broker credentials are encrypted and stored securely. We never store your passwords in plain text. Your connection details are only used to communicate with your broker's API and are never shared with third parties.</p>
        </div>
      </div>
    </div>
  );
} 