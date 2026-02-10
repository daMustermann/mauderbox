import { useAutoUpdater } from '@/hooks/useAutoUpdater';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AutoUpdater() {
  const { status, checkForUpdates, downloadAndInstall, restartAndInstall } = useAutoUpdater(true);

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Card className="bg-secondary/20 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Auto-Updates
            </CardTitle>
            <CardDescription>
              Automatische Aktualisierungen für Mauderbox
            </CardDescription>
          </div>
          {!status.checking && !status.available && !status.downloading && !status.installing && (
            <Button
              variant="outline"
              size="sm"
              onClick={checkForUpdates}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Prüfen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checking State */}
        {status.checking && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50 border border-white/5">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            <div>
              <p className="text-sm font-medium">Suche nach Updates...</p>
              <p className="text-xs text-muted-foreground">Dies kann einen Moment dauern</p>
            </div>
          </div>
        )}

        {/* No Update Available */}
        {!status.checking && !status.available && !status.error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50 border border-green-500/20">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-400">Auf dem neuesten Stand</p>
              <p className="text-xs text-muted-foreground">Keine Updates verfügbar</p>
            </div>
          </div>
        )}

        {/* Update Available */}
        {status.available && !status.downloading && !status.installing && !status.readyToInstall && (
          <div className="space-y-4">
            <Alert className="border-blue-500/20 bg-blue-500/10">
              <Download className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-sm">
                <span className="font-medium">Neue Version verfügbar: {status.version}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Ein Update ist bereit zum Download
                </p>
              </AlertDescription>
            </Alert>
            <Button
              onClick={downloadAndInstall}
              className="w-full gap-2"
              size="lg"
            >
              <Download className="h-4 w-4" />
              Update herunterladen
            </Button>
          </div>
        )}

        {/* Downloading */}
        {status.downloading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <span className="text-sm font-medium">Wird heruntergeladen...</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {status.downloadProgress}%
              </Badge>
            </div>
            <Progress value={status.downloadProgress} className="h-2" />
            {status.downloadedBytes && status.totalBytes && (
              <p className="text-xs text-muted-foreground text-center">
                {formatBytes(status.downloadedBytes)} / {formatBytes(status.totalBytes)}
              </p>
            )}
          </div>
        )}

        {/* Ready to Install */}
        {status.readyToInstall && !status.installing && (
          <div className="space-y-4">
            <Alert className="border-green-500/20 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-sm">
                <span className="font-medium text-green-400">Download abgeschlossen</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Das Update ist bereit zur Installation
                </p>
              </AlertDescription>
            </Alert>
            <Button
              onClick={restartAndInstall}
              className="w-full gap-2"
              size="lg"
            >
              <RefreshCw className="h-4 w-4" />
              Jetzt installieren & neu starten
            </Button>
          </div>
        )}

        {/* Installing */}
        {status.installing && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50 border border-blue-500/20">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-400">Installation läuft...</p>
              <p className="text-xs text-muted-foreground">Die App wird automatisch neu gestartet</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status.error && (
          <Alert variant="destructive" className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Fehler beim Update</span>
              <p className="text-xs mt-1">{status.error}</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
