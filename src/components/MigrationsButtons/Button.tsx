import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

const MigrationButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{
    total: number;
    migrated: number;
    current: string;
  } | null>(null);

  const runMigration = async () => {
    setIsLoading(true);
    
    // Show initial toast
    const toastId = toast.loading('Starting migration of hints to Two Pointers tag...', {
      position: 'bottom-right',
    });
    
    try {
      // Create an EventSource for SSE connection
      const eventSource = new EventSource('/api/admin/migrate-hints-to-two-pointers');
      
      // Set up event listeners
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Handle different event types
        switch (data.type) {
          case 'status':
            toast.loading(data.data, { id: toastId });
            break;
            
          case 'progress':
            setProgress({
              total: data.data.total,
              migrated: data.data.migrated,
              current: data.data.currentQuestion
            });
            
            // Update the toast with progress
            toast.loading(
              `Migrating: ${data.data.migrated}/${data.data.total} (${Math.round(data.data.migrated / data.data.total * 100)}%)`,
              { id: toastId }
            );
            break;
            
          case 'complete':
            // Show success message
            toast.success(data.data.message, {
              id: toastId,
              duration: 5000
            });
            
            // Clean up
            eventSource.close();
            setIsLoading(false);
            setProgress(null);
            break;
            
          case 'error':
            // Show error message
            toast.error(`Migration failed: ${data.data.message}`, {
              id: toastId,
              duration: 5000
            });
            
            // Clean up
            eventSource.close();
            setIsLoading(false);
            setProgress(null);
            break;
        }
      };
      
      // Handle connection errors
      eventSource.onerror = () => {
        toast.error('Connection error. Please try again.', {
          id: toastId,
          duration: 5000
        });
        
        eventSource.close();
        setIsLoading(false);
        setProgress(null);
      };
      
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Failed to start migration. Please try again.', {
        id: toastId,
        duration: 5000
      });
      
      setIsLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={runMigration} 
        disabled={isLoading}
        variant="default"
        className="flex items-center space-x-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Migrating Hints...</span>
          </>
        ) : (
          <span>Migrate Hints to Two Pointers</span>
        )}
      </Button>
      
      {/* Progress display */}
      {progress && (
        <div className="bg-gray-100 p-4 rounded-md border border-gray-200">
          <h3 className="font-medium mb-2">Migration Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${Math.round(progress.migrated / progress.total * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-sm text-gray-600">
            <span>{progress.migrated} / {progress.total} migrated</span>
            <span>{Math.round(progress.migrated / progress.total * 100)}%</span>
          </div>
          <p className="text-sm mt-2 text-gray-600">
            Currently processing: {progress.current}
          </p>
        </div>
      )}
    </div>
  );
};

export default MigrationButton;