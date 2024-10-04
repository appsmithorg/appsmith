import { useEffect } from "react";
import log from "loglevel";
const Heartbeat = () => {
  const heartbeatUrl =
    "https://uptime.betterstack.com/api/v1/heartbeat/71SZmsvAVW73QvEPQzLvxwEL";
  const interval = 30 * 1000; // 30 secs in milliseconds

  const sendHeartbeat = async () => {
    try {
      const response = await fetch(heartbeatUrl);

      if (response.ok) {
        log.info("Heartbeat sent successfully");
      } else {
        log.error("Failed to send heartbeat", response.status);
      }
    } catch (error) {
      log.error("Error sending heartbeat:", error);
    }
  };

  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, interval);

    // Cleanup the interval when the component is unmounted
    return () => clearInterval(heartbeatInterval);
  }, []); // Empty dependency array ensures this runs once on mount

  return null; // This component doesn't render anything
};

export default Heartbeat;
