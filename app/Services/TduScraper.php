<?php

namespace App\Services;

use Carbon\Carbon;
use DOMDocument;
use DOMXPath;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TduScraper
{
    protected string $baseUrl = 'https://allthetdu.com';
    protected int $year;

    // Column dates - mapped from the date header row
    protected array $columnDates = [];

    // Current row category
    protected string $currentCategory = 'Other';

    public function __construct()
    {
        $this->year = (int) date('Y');
    }

    /**
     * Set the year for date parsing.
     */
    public function setYear(int $year): self
    {
        $this->year = $year;
        return $this;
    }

    /**
     * Scrape events from the TDU website.
     */
    public function scrape(?string $url = null): array
    {
        $url = $url ?? $this->baseUrl;

        Log::info("Scraping TDU events from: {$url}");

        $response = Http::timeout(30)
            ->withHeaders([
                'User-Agent' => 'TDU-Planner/1.0 (+https://github.com/your-repo)',
            ])
            ->get($url);

        if (!$response->successful()) {
            throw new \RuntimeException("Failed to fetch URL: {$url} (HTTP {$response->status()})");
        }

        $html = $response->body();

        // Handle UTF-16 encoding if present
        if (substr($html, 0, 2) === "\xFF\xFE" || substr($html, 0, 2) === "\xFE\xFF") {
            $html = mb_convert_encoding($html, 'UTF-8', 'UTF-16');
        }

        return $this->parseHtml($html);
    }

    /**
     * Parse events from HTML content.
     */
    public function parseHtml(string $html): array
    {
        $events = [];

        // Suppress HTML parsing warnings
        libxml_use_internal_errors(true);

        $doc = new DOMDocument();
        $doc->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);

        libxml_clear_errors();

        $xpath = new DOMXPath($doc);

        // Find all table rows
        $rows = $xpath->query('//tr');
        $rowIndex = 0;

        foreach ($rows as $row) {
            $cells = $xpath->query('.//td', $row);

            // Row 2 (index 2) typically has date headers
            if ($rowIndex === 2 && $cells->length > 1) {
                $this->extractColumnDates($cells);
                $rowIndex++;
                continue;
            }

            // Skip header rows
            if ($rowIndex < 3) {
                $rowIndex++;
                continue;
            }

            // Parse this row for events
            $rowEvents = $this->parseTableRow($xpath, $row, $cells);
            $events = array_merge($events, $rowEvents);

            $rowIndex++;
        }

        // Deduplicate events by external_id
        $events = $this->deduplicateEvents($events);

        Log::info("Parsed " . count($events) . " events from HTML");

        return [
            'source' => $this->baseUrl,
            'scraped_at' => now()->toIso8601String(),
            'events' => $events,
        ];
    }

    /**
     * Extract column dates from the header row cells.
     */
    protected function extractColumnDates(\DOMNodeList $cells): void
    {
        $this->columnDates = [];

        $colIndex = 0;
        foreach ($cells as $cell) {
            $text = trim($cell->textContent);

            // Parse dates like "Friday 16th January", "Saturday17th January"
            if (preg_match('/(\d{1,2})(?:st|nd|rd|th)?\s*(?:Jan(?:uary)?|Feb(?:ruary)?)/i', $text, $matches)) {
                $day = (int) $matches[1];
                $month = stripos($text, 'Feb') !== false ? 2 : 1;
                $this->columnDates[$colIndex] = Carbon::create($this->year, $month, $day);
            }

            // Handle colspan
            $colspan = (int) ($cell->getAttribute('colspan') ?: 1);
            $colIndex += $colspan;
        }

        Log::info("Extracted " . count($this->columnDates) . " column dates", [
            'dates' => array_map(fn ($d) => $d->format('Y-m-d'), $this->columnDates)
        ]);
    }

    /**
     * Parse a table row for events.
     */
    protected function parseTableRow(DOMXPath $xpath, \DOMNode $row, \DOMNodeList $cells): array
    {
        $events = [];

        // Check first cell for category header (H1 tag)
        if ($cells->length > 0) {
            $h1 = $xpath->query('.//h1', $cells->item(0));
            if ($h1->length > 0) {
                $categoryText = trim($h1->item(0)->textContent);
                $this->currentCategory = $this->mapCategory($categoryText);
            }
        }

        // Parse each cell for events
        $colIndex = 0;
        foreach ($cells as $cell) {
            // Get the date for this column
            $date = $this->columnDates[$colIndex] ?? null;

            if ($date) {
                // Parse events from this cell
                $cellEvents = $this->parseCellEvents($xpath, $cell, $date);
                $events = array_merge($events, $cellEvents);
            }

            // Handle colspan
            $colspan = (int) ($cell->getAttribute('colspan') ?: 1);
            $colIndex += $colspan;
        }

        return $events;
    }

    /**
     * Map category text to slug.
     */
    protected function mapCategory(string $categoryText): string
    {
        foreach (config('tdu_scraper.category_mappings', []) as $pattern => $category) {
            if (stripos($categoryText, $pattern) !== false) {
                return $category;
            }
        }

        return 'other';
    }

    /**
     * Parse events from a single table cell.
     */
    protected function parseCellEvents(DOMXPath $xpath, \DOMNode $cell, Carbon $date): array
    {
        $events = [];

        // Skip cells with H1 (category headers)
        $h1 = $xpath->query('.//h1', $cell);
        if ($h1->length > 0) {
            return [];
        }

        // Get all paragraphs
        $paragraphs = $xpath->query('.//p', $cell);

        $currentLocation = null;
        $currentTime = null;

        foreach ($paragraphs as $p) {
            $text = trim($p->textContent);
            if (empty($text)) {
                continue;
            }

            // Check for location link (Google Maps)
            $locationLink = $xpath->query('.//a[contains(@href, "maps") or contains(@href, "goo.gl/maps")]', $p);
            if ($locationLink->length > 0) {
                $currentLocation = $this->cleanText($locationLink->item(0)->textContent);
                continue;
            }

            // Check for time pattern like "12pm-4pm:" or "6am:"
            if (preg_match('/^(\d{1,2}(?::\d{2})?(?:am|pm))\s*[-–]?\s*(\d{1,2}(?::\d{2})?(?:am|pm))?[:\s]*$/i', $text, $matches)) {
                $currentTime = [
                    'start' => $this->normalizeTime($matches[1]),
                    'end' => isset($matches[2]) && !empty($matches[2]) ? $this->normalizeTime($matches[2]) : null,
                ];
                continue;
            }

            // Check for event link
            $eventLinks = $xpath->query('.//a', $p);
            if ($eventLinks->length > 0) {
                foreach ($eventLinks as $link) {
                    $href = $link->getAttribute('href');
                    $eventName = $this->cleanText($link->textContent);

                    // Skip location links and very short text
                    if (strlen($eventName) < 4) {
                        continue;
                    }
                    if (stripos($href, 'maps') !== false || stripos($href, 'goo.gl/maps') !== false) {
                        continue;
                    }

                    $eventUrl = $this->extractRealUrl($href);

                    $event = $this->createEventFromData(
                        $eventName,
                        $date,
                        $currentTime,
                        $currentLocation,
                        $eventUrl
                    );

                    if ($event) {
                        $events[] = $event;
                    }
                }
            }
        }

        return $events;
    }

    /**
     * Create an event array from parsed data.
     */
    protected function createEventFromData(
        string $title,
        Carbon $date,
        ?array $time,
        ?string $location,
        ?string $url
    ): ?array {
        // Skip very short titles
        if (strlen($title) < 4) {
            return null;
        }

        // Build datetime
        $startDatetime = $date->copy();
        $endDatetime = $date->copy();

        if ($time) {
            $startDatetime->setTimeFromTimeString($time['start']);
            if ($time['end']) {
                $endDatetime->setTimeFromTimeString($time['end']);
            } else {
                $endDatetime->setTimeFromTimeString($time['start'])->addHour();
            }
        } else {
            $startDatetime->setTime(9, 0);
            $endDatetime->setTime(17, 0);
        }

        return [
            'title' => $title,
            'description' => null,
            'start_datetime' => $startDatetime->toIso8601String(),
            'end_datetime' => $endDatetime->toIso8601String(),
            'category' => $this->currentCategory,
            'sponsor' => $this->inferSponsor($title),
            'location' => $location ? ['name' => $this->normalizeLocation($location)] : null,
            'ride_distance_km' => $this->extractDistance($title),
            'elevation_gain_m' => $this->extractElevation($title),
            'min_cost' => null,
            'max_cost' => null,
            'is_free' => true,
            'is_featured' => $this->isFeaturedEvent($title),
            'is_recurring' => false,
            'is_womens' => $this->isWomensEvent($title),
            'url' => $url,
            'external_id' => $this->generateExternalId($title, $startDatetime),
        ];
    }

    /**
     * Normalize time to 24-hour format.
     */
    protected function normalizeTime(string $time): string
    {
        $time = strtolower(trim($time));

        if (preg_match('/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i', $time, $matches)) {
            $hour = (int) $matches[1];
            $minute = isset($matches[2]) ? (int) $matches[2] : 0;
            $ampm = $matches[3] ?? null;

            if ($ampm) {
                if ($ampm === 'pm' && $hour < 12) {
                    $hour += 12;
                } elseif ($ampm === 'am' && $hour === 12) {
                    $hour = 0;
                }
            }

            return sprintf('%02d:%02d', $hour, $minute);
        }

        return '09:00';
    }

    /**
     * Extract real URL from Google redirect.
     */
    protected function extractRealUrl(string $url): ?string
    {
        if (preg_match('/[?&]q=([^&]+)/', $url, $matches)) {
            return urldecode($matches[1]);
        }
        return $url;
    }

    /**
     * Clean text content.
     */
    protected function cleanText(string $text): string
    {
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

    /**
     * Infer sponsor from title.
     */
    protected function inferSponsor(string $title): ?string
    {
        foreach (config('tdu_scraper.sponsor_mappings', []) as $name => $slug) {
            if (stripos($title, $name) !== false) {
                return $slug;
            }
        }

        return null;
    }

    /**
     * Normalize location name.
     */
    protected function normalizeLocation(string $location): string
    {
        $location = preg_replace('/,\s*(Adelaide|SA|South Australia)\s*\d*$/i', '', $location);
        $location = trim($location, ', ');

        foreach (config('tdu_scraper.location_mappings', []) as $pattern => $normalized) {
            if (stripos($location, $pattern) !== false) {
                return $normalized;
            }
        }

        return $location;
    }

    /**
     * Check if this is a featured event.
     */
    protected function isFeaturedEvent(string $title): bool
    {
        foreach (config('tdu_scraper.featured_keywords', []) as $keyword) {
            if (stripos($title, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if this is a women's tailored event.
     */
    protected function isWomensEvent(string $title): bool
    {
        foreach (config('tdu_scraper.womens_keywords', []) as $keyword) {
            if (stripos($title, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Extract distance from title (e.g., "150km ride").
     */
    protected function extractDistance(string $title): ?float
    {
        if (preg_match('/(\d+(?:\.\d+)?)\s*km/i', $title, $matches)) {
            return (float) $matches[1];
        }
        return null;
    }

    /**
     * Extract elevation from title (e.g., "2000m elevation").
     */
    protected function extractElevation(string $title): ?int
    {
        if (preg_match('/(\d+)\s*m\s*(?:elevation|climb|vertical)/i', $title, $matches)) {
            return (int) $matches[1];
        }
        return null;
    }

    /**
     * Generate a unique external ID for an event.
     */
    protected function generateExternalId(string $title, Carbon $date): string
    {
        return 'tdu-' . $date->format('Y-m-d') . '-' . Str::slug(Str::limit($title, 40, ''));
    }

    /**
     * Deduplicate events by external_id.
     */
    protected function deduplicateEvents(array $events): array
    {
        $seen = [];
        $unique = [];

        foreach ($events as $event) {
            $id = $event['external_id'];
            if (!isset($seen[$id])) {
                $seen[$id] = true;
                $unique[] = $event;
            }
        }

        return $unique;
    }

    /**
     * Save scraped data to a JSON file.
     */
    public function saveToFile(array $data, string $filename): void
    {
        $path = database_path("data/{$filename}");

        $directory = dirname($path);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        file_put_contents(
            $path,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );

        Log::info("Saved scraped data to: {$path}");
    }
}
