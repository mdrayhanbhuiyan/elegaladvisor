import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackHeartbeat } from '@/services/analyticsService';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Basic page view tracking
    trackPageView(location.pathname + location.search);

    // Heartbeat for "active users" - once every 2 minutes while page is focused
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        trackHeartbeat(location.pathname);
      }
    }, 120000);

    return () => clearInterval(heartbeatInterval);
  }, [location]);

  return null;
}
