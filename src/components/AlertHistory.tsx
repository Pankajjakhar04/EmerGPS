import { useState, useEffect } from 'react';
import { History, MapPin, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { supabase, Alert } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AlertHistory() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
      fetchAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            Active
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-slate-100 p-3 rounded-lg">
          <History className="w-6 h-6 text-slate-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alert History</h2>
          <p className="text-sm text-gray-600">View your recent emergency alerts</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <History className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Alerts Yet</h3>
          <p className="text-gray-600">Your emergency alert history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(alert.status)}
                    {alert.tracking_enabled && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        <MapPin className="w-3 h-3" />
                        Tracking Enabled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(alert.created_at)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                    {alert.accuracy && <span className="text-xs">({alert.accuracy.toFixed(0)}m accuracy)</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <a
                    href={alert.maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View on Google Maps"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>

              {alert.resolved_at && (
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                  Resolved: {formatDate(alert.resolved_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
