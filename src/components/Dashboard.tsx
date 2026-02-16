import { useState } from 'react';
import { Shield, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PanicButton from './PanicButton';
import EmergencyContacts from './EmergencyContacts';
import AlertHistory from './AlertHistory';
import LiveTracking from './LiveTracking';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAlertCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Emergency Alert System</h1>
                <p className="text-xs text-gray-500">Real-time safety monitoring</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user?.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <LiveTracking key={refreshKey} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PanicButton onAlertCreated={handleAlertCreated} />
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-2">How It Works</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">1.</span>
                  <span>Press the panic button to instantly capture your GPS location</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">2.</span>
                  <span>Alerts are immediately sent via email and Telegram to your emergency contacts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">3.</span>
                  <span>Live tracking monitors your location for 30 minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">4.</span>
                  <span>Your contacts receive a Google Maps link to find you quickly</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
              <h3 className="text-lg font-bold text-amber-900 mb-2">Privacy & Security</h3>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Location data collected only with your explicit consent</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>All data encrypted and stored securely in the database</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>You have full control over your emergency contacts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Tracking automatically stops after 30 minutes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <EmergencyContacts />
          <AlertHistory key={refreshKey} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Emergency Alert System - Your safety is our priority
          </p>
        </div>
      </footer>
    </div>
  );
}
