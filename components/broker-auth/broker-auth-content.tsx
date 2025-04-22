'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/lib/notification';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, ChevronRight, CheckCircle, AlertCircle, Shield, ServerIcon, KeyIcon, LinkIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  { name: 'Angel Broking', fields: ['API Key', 'Secret Key'] },
  { name: 'Binance', fields: ['App Key', 'Secret Key'] },
  { name: 'Delta Exchange', fields: ['API Key', 'Secret Key'] },
  { name: 'Dhan', fields: ['Client ID', 'Access Token'] },
  { name: 'Finvasia', fields: ['User ID', 'Password', 'Vendor Code', 'API Key', '2FA'] },
  { name: 'Fyers', fields: ['API Key', 'Secret Key'] },
  { name: 'ICICI Direct', fields: ['User ID', 'API Key', 'Secret Key', 'DOB', 'Password'] },
  { name: 'IIFL', fields: ['Interactive API Key', 'Interactive Secret Key', 'Market API Key', 'Secret Key'] },
  { name: 'Kotak Neo', fields: ['Consumer Key', 'Secret Key', 'Access Token', 'Mobile No.', 'Password', 'MPIN'] },
  { name: 'MetaTrader 4', fields: ['User ID', 'Password', 'Host', 'Port'] },
  { name: 'MetaTrader 5', fields: ['User ID', 'Password', 'Host', 'Port'] },
  { name: 'Upstox', fields: ['API Key', 'App Secret Key', 'Access Token'] },
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
  const { showNotification } = useNotification();

  // Fetch saved brokers on component mount
  useEffect(() => {
    fetchSavedBrokers();
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
        title: 'Failed to load saved brokers',
        description: error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBroker = async (broker: BrokerCredential) => {
    try {
      const newStatus = !broker.is_active;
      
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
        title: newStatus ? 'Broker Activated' : 'Broker Deactivated',
        type: 'success',
      });
    } catch (error: any) {
      showNotification({
        title: 'Failed to update broker status',
        description: error.message,
        type: 'error',
      });
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
        title: 'Broker Deleted Successfully',
        type: 'success',
      });
    } catch (error: any) {
      showNotification({
        title: 'Failed to delete broker',
        description: error.message,
        type: 'error',
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
        title: 'Broker Connected Successfully',
        type: 'success',
      });
    } catch (error: any) {
      showNotification({
        title: 'Connection Failed',
        description: error.message || 'An unexpected error occurred',
        type: 'error',
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
      
      showNotification({
        title: 'Broker Updated Successfully',
        type: 'success',
      });
    } catch (error: any) {
      showNotification({
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred',
        type: 'error',
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
                        className="data-[state=checked]:bg-green-700 data-[state=unchecked]:bg-zinc-700"
                      />
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
                    <LinkIcon className="h-3.5 w-3.5 mr-1" /> CONNECT_NEW_BROKER
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
                      CONNECT
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
              CONNECT {selectedBroker?.name.toUpperCase() || ''}
            </DialogTitle>
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
              {loading ? 'CONNECTING...' : 'CONNECT'}
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
              UPDATE_BROKER_CREDENTIALS
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