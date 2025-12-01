import { formatRelativeTime } from "@/utilities/util";
import { useEffect, useState, memo } from "react";

interface RelativeTimeDisplayProps {
  fetchedAt: string;
  duration: string | number;
}

/**
 * Component that displays relative time and automatically updates every minute.
 * The timer resets whenever the fetchedAt prop changes.
 */
export const RelativeTimeDisplay = memo((props: RelativeTimeDisplayProps) => {
  const { fetchedAt, duration } = props;
  
  // State to force re-render every minute for relative time updates
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  useEffect(() => {
    // Update every minute to refresh relative time display
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // 60 seconds = 1 minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Reset timer when fetchedAt changes (new data fetched)
  useEffect(() => {
    setCurrentTime(Date.now());
  }, [fetchedAt]);
  
  return (
    <span className='small'>
      Scanned <strong>{formatRelativeTime(fetchedAt)}</strong>{" "}
      for {duration !== 'today' ? <>last <strong>{duration}</strong></> : `today`}
    </span>
  );
});

RelativeTimeDisplay.displayName = "RelativeTimeDisplay";

