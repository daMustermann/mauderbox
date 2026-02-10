import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useServerStore } from '@/stores/serverStore';
import { isTauri, setKeepServerRunning, startServer } from '@/lib/tauri';

const connectionSchema = z.object({
  serverUrl: z.string().url('Please enter a valid URL'),
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

export function ConnectionForm() {
  const serverUrl = useServerStore((state) => state.serverUrl);
  const setServerUrl = useServerStore((state) => state.setServerUrl);
  const setKeepServerRunningOnClose = useServerStore((state) => state.setKeepServerRunningOnClose);
  const serviceMode = useServerStore((state) => state.serviceMode);
  const setServiceMode = useServerStore((state) => state.setServiceMode);
  const { toast } = useToast();

  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      serverUrl: serverUrl,
    },
  });

  // Sync form with store when serverUrl changes externally
  useEffect(() => {
    form.reset({ serverUrl });
  }, [serverUrl, form]);

  const { isDirty } = form.formState;

  function onSubmit(data: ConnectionFormValues) {
    setServerUrl(data.serverUrl);
    form.reset(data); // Reset form state after successful submission
    toast({
      title: 'Server URL updated',
      description: `Connected to ${data.serverUrl}`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Connection</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="serverUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server URL</FormLabel>
                  <FormControl>
                    <Input placeholder="http://127.0.0.1:17493" {...field} />
                  </FormControl>
                  <FormDescription>Enter the URL of your voicebox backend server</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isDirty && <Button type="submit">Update Connection</Button>}
          </form>
        </Form>

        <div className="mt-6 pt-6 border-t">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="serviceMode"
              checked={serviceMode}
              onCheckedChange={(checked: boolean) => {
                const enabled = Boolean(checked);
                setServiceMode(enabled);
                setKeepServerRunningOnClose(enabled);
                setKeepServerRunning(enabled).catch((error) => {
                  console.error('Failed to sync setting to Rust:', error);
                });

                if (enabled && isTauri()) {
                  startServer(false)
                    .then((serverUrl) => {
                      setServerUrl(serverUrl);
                      // @ts-expect-error - adding property to window
                      window.__voiceboxServerStartedByApp = true;
                    })
                    .catch((error) => {
                      console.error('Failed to start server in service mode:', error);
                    });
                }
                toast({
                  title: 'Setting updated',
                  description: enabled
                    ? 'Server will keep running in the background'
                    : 'Server will stop when app closes',
                });
              }}
            />
            <div className="space-y-1">
              <label
                htmlFor="serviceMode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Run server as a background service
              </label>
              <p className="text-sm text-muted-foreground">
                Starts the server in the background and keeps it running after closing the app.
                Disabled by default.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
