<?php

namespace App\Console\Commands;

use App\Services\EventImporter;
use App\Services\TduScraper;
use Illuminate\Console\Command;

class ImportEvents extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'events:import
                            {--source=json : Import source: "json" (file), "url" (scrape website), or "scrape-save" (scrape and save to file)}
                            {--file= : JSON file path (relative to database/data/ or absolute)}
                            {--url= : URL to scrape (defaults to allthetdu.com)}
                            {--year= : Year for date parsing (defaults to current year)}
                            {--dry-run : Preview what would be imported without making changes}
                            {--save-as= : Save scraped data to this filename before importing}';

    /**
     * The console command description.
     */
    protected $description = 'Import TDU events from JSON file or by scraping allthetdu.com';

    /**
     * Execute the console command.
     */
    public function handle(EventImporter $importer, TduScraper $scraper): int
    {
        $source = $this->option('source');
        $dryRun = $this->option('dry-run');

        $this->info('');
        $this->info('╔══════════════════════════════════════════╗');
        $this->info('║       TDU Events Import Tool             ║');
        $this->info('╚══════════════════════════════════════════╝');
        $this->info('');

        if ($dryRun) {
            $this->warn('🔍 DRY RUN MODE - No changes will be made');
            $this->info('');
        }

        try {
            $data = match ($source) {
                'json' => $this->loadFromJson(),
                'url' => $this->scrapeFromUrl($scraper),
                'scrape-save' => $this->scrapeAndSave($scraper),
                default => throw new \InvalidArgumentException("Invalid source: {$source}"),
            };

            if (empty($data['events'])) {
                $this->warn('No events found to import.');
                return self::SUCCESS;
            }

            $this->info("📦 Found {$this->countEvents($data)} events from source: {$data['source']}");
            $this->info('');

            // Show preview of events
            if ($this->option('verbose') || $dryRun) {
                $this->showEventPreview($data['events']);
            }

            // Confirm import (unless dry run)
            if (!$dryRun && !$this->option('no-interaction')) {
                if (!$this->confirm('Do you want to proceed with the import?', true)) {
                    $this->info('Import cancelled.');
                    return self::SUCCESS;
                }
            }

            // Perform import
            $this->info('Importing events...');
            $stats = $importer->import($data, $dryRun);

            $this->showStats($stats);

            if (!empty($stats['errors'])) {
                $this->showErrors($stats['errors']);
            }

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Error: {$e->getMessage()}");
            if ($this->option('verbose')) {
                $this->error($e->getTraceAsString());
            }
            return self::FAILURE;
        }
    }

    /**
     * Load events from a JSON file.
     */
    protected function loadFromJson(): array
    {
        $file = $this->option('file');

        if (empty($file)) {
            // Show available files
            $dataPath = database_path('data');
            if (is_dir($dataPath)) {
                $files = glob("{$dataPath}/*.json");
                $files = array_filter($files, fn($f) => !str_contains($f, 'schema'));

                if (!empty($files)) {
                    $this->info('Available JSON files:');
                    foreach ($files as $f) {
                        $this->line('  - ' . basename($f));
                    }
                    $this->info('');
                }
            }

            $file = $this->ask('Enter JSON filename (in database/data/)');
        }

        // Resolve file path
        if (!str_starts_with($file, '/') && !str_contains($file, ':')) {
            $file = database_path("data/{$file}");
        }

        if (!file_exists($file)) {
            throw new \RuntimeException("File not found: {$file}");
        }

        $this->info("📂 Loading from: {$file}");

        $content = file_get_contents($file);
        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Invalid JSON: ' . json_last_error_msg());
        }

        return $data;
    }

    /**
     * Scrape events from URL.
     */
    protected function scrapeFromUrl(TduScraper $scraper): array
    {
        $url = $this->option('url') ?? 'https://allthetdu.com';
        $year = $this->option('year') ?? date('Y');

        $this->info("🌐 Scraping from: {$url}");
        $this->info("📅 Using year: {$year}");
        $this->info('');

        $scraper->setYear((int) $year);

        $data = $scraper->scrape($url);

        // Optionally save to file
        $saveAs = $this->option('save-as');
        if ($saveAs) {
            $scraper->saveToFile($data, $saveAs);
            $this->info("💾 Saved scraped data to: database/data/{$saveAs}");
        }

        return $data;
    }

    /**
     * Scrape and save to file without importing.
     */
    protected function scrapeAndSave(TduScraper $scraper): array
    {
        $url = $this->option('url') ?? 'https://allthetdu.com';
        $year = $this->option('year') ?? date('Y');
        $filename = $this->option('save-as') ?? 'scraped-events-' . date('Y-m-d-His') . '.json';

        $this->info("🌐 Scraping from: {$url}");
        $this->info("📅 Using year: {$year}");
        $this->info('');

        $scraper->setYear((int) $year);

        $data = $scraper->scrape($url);

        $scraper->saveToFile($data, $filename);
        $this->info("💾 Saved scraped data to: database/data/{$filename}");
        $this->info('');
        $this->info('To import this data later, run:');
        $this->line("  php artisan events:import --source=json --file={$filename}");

        return $data;
    }

    /**
     * Count events in data.
     */
    protected function countEvents(array $data): int
    {
        return count($data['events'] ?? []);
    }

    /**
     * Show a preview of events to be imported.
     */
    protected function showEventPreview(array $events): void
    {
        $preview = array_slice($events, 0, 10);

        $this->info('📋 Event Preview (first 10):');
        $this->table(
            ['Title', 'Date', 'Category', 'Location'],
            array_map(fn($e) => [
                \Illuminate\Support\Str::limit($e['title'], 40),
                \Carbon\Carbon::parse($e['start_datetime'])->format('D d M Y'),
                $e['category'] ?? '-',
                $e['location']['name'] ?? '-',
            ], $preview)
        );

        if (count($events) > 10) {
            $this->info('  ... and ' . (count($events) - 10) . ' more events');
        }
        $this->info('');
    }

    /**
     * Show import statistics.
     */
    protected function showStats(array $stats): void
    {
        $this->info('');
        $this->info('╔══════════════════════════════════════════╗');
        $this->info('║           Import Results                 ║');
        $this->info('╠══════════════════════════════════════════╣');

        $rows = [
            ['Events Created', $stats['events_created'], '✅'],
            ['Events Updated', $stats['events_updated'], '🔄'],
            ['Events Skipped', $stats['events_skipped'], '⏭️'],
            ['Categories Created', $stats['categories_created'], '📁'],
            ['Sponsors Created', $stats['sponsors_created'], '🏢'],
            ['Locations Created', $stats['locations_created'], '📍'],
        ];

        foreach ($rows as [$label, $count, $icon]) {
            if ($count > 0) {
                $this->info(sprintf('║  %s %-22s %5d       ║', $icon, $label, $count));
            }
        }

        $this->info('╚══════════════════════════════════════════╝');
        $this->info('');
    }

    /**
     * Show import errors.
     */
    protected function showErrors(array $errors): void
    {
        $this->warn('⚠️  Some events failed to import:');

        foreach (array_slice($errors, 0, 5) as $error) {
            $this->line("  • {$error['title']}: {$error['error']}");
        }

        if (count($errors) > 5) {
            $this->line('  ... and ' . (count($errors) - 5) . ' more errors');
        }

        $this->info('');
    }
}
