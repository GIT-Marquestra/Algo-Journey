'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeetCodeStatsCollector() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    success: boolean;
    details?: string;
  } | null>(null);

  const collectStats = async () => {
    try {
      setLoading(true);
      setStatus(null);
      
      const response = await fetch('/api/leetcode-stats', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      setStatus({
        message: data.message,
        success: response.ok,
        details: data.failedUsers?.length > 0 
          ? `Failed users: ${data.failedUsers.join(', ')}` 
          : undefined
      });
      toast.success(data.message)
    } catch (error) {
      setStatus({
        message: 'An error occurred while collecting stats',
        success: false,
        details: String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>LeetCode Statistics Collection</CardTitle>
        <CardDescription>
          Collect statistics for all users with LeetCode accounts (210 users total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This tool fetches LeetCode statistics for all registered users in the database, 
            including problems solved by difficulty level. The process uses rate limiting 
            to avoid overloading the LeetCode API.
          </p>
          
          {status && (
            <Alert variant={status.success ? "default" : "destructive"}>
              <AlertTitle>{status.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{status.message}</p>
                {status.details && <p className="text-xs">{status.details}</p>}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={collectStats} 
          disabled={loading}
          className="flex items-center gap-2 bg-blue-700"
        >
          {loading ? 'Processing...' : 'Collect LeetCode Stats'}
          {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
        </Button>
      </CardFooter>
    </Card>
  );
}