/**
 * Route fetcher/converter — attempts to download and convert all event route
 * URLs to GeoJSON. Run with: node scripts/probe-routes.mjs
 *
 * Source types handled:
 *   strava-route   → requires OAuth (skipped — see notes below)
 *   strava-event   → group event pages with no geodata (skipped)
 *   ridewithgps    → public JSON API at /routes/{id}.json → track_points
 *   tdu-download   → direct GPX/KML file downloads
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { DOMParser } from '@xmldom/xmldom';
import { gpx, kml } from '@tmcw/togeojson';

// ─── All events with route_url from the DB ───────────────────────────────────
const routes = [
    { id: 1,   title: "Ziptrak® Women's Stage 1",                        url: 'https://www.strava.com/routes/3389851475221262968' },
    { id: 2,   title: "Health Partners Women's Stage 2",                  url: 'https://www.strava.com/routes/3389851828406094456' },
    { id: 3,   title: "Hyundai Women's Stage 3",                          url: 'https://www.strava.com/routes/3389854524000056508' },
    { id: 4,   title: "South Australia Men's Prologue",                   url: 'https://tourdownunder.com.au/file-download/?key=a19e73df-387d-4247-aa8b-2480ef5ac691' },
    { id: 5,   title: "Vanguard Men's Stage 1",                           url: 'https://www.strava.com/routes/3388749192173533970' },
    { id: 6,   title: "Vanguard Women's One Day Race",                    url: 'https://tourdownunder.com.au/file-download/?key=872b5af6-4200-47db-9854-88755114dfec' },
    { id: 7,   title: "Health Partners Men's Stage 2",                    url: 'https://www.strava.com/routes/3388753940383719554' },
    { id: 8,   title: "Ziptrak® Men's Stage 3",                          url: 'https://www.strava.com/routes/3388754699876948548' },
    { id: 9,   title: "THINK! Road Safety Men's Stage 4",                 url: 'https://tourdownunder.com.au/file-download/?key=1f0bc2b0-b2c9-42e8-9461-19fe4d29d330' },
    { id: 10,  title: "EFEX Men's Stage 5",                               url: 'https://www.strava.com/routes/3389850732635929156' },
    { id: 51,  title: "Adelaide Epic Ride - Full Course",                  url: 'https://ridewithgps.com/routes/51766158' },
    { id: 100, title: "ADL26 Ride 1 - Windy Point",                       url: 'https://www.strava.com/routes/3428550386718006408' },
    { id: 101, title: "ADL26 Ride 2 - Bradbury > Nortons",                url: 'https://www.strava.com/routes/3428529877257452896' },
    { id: 102, title: "LITP Gravel Ride with Mitch Docker",               url: 'https://www.strava.com/routes/3435471004821777880' },
    { id: 104, title: "ADL26 Ride 4 - Crafers",                           url: 'https://www.strava.com/routes/3428550386717804680' },
    { id: 105, title: "ADL26 Ride 5 - Corkscrew",                         url: 'https://www.strava.com/routes/3428542338102606030' },
    { id: 106, title: "ADL26 Ride 6 - Willunga Pilgrimage",               url: 'https://www.strava.com/routes/3449282558943811086' },
    { id: 115, title: "TDU26 Women's Ride",                               url: 'https://ridewithgps.com/routes/53527519' },
    { id: 116, title: "Beach Training Ride",                               url: 'https://ridewithgps.com/routes/53678732' },
    { id: 120, title: "MOOD Racing - Scenic Sunset - TDU Edition",         url: 'https://www.strava.com/clubs/614528/group_events/343585510853466' },
    { id: 122, title: "Beach Ride: Cycle Closet x Santini",               url: 'https://www.strava.com/routes/3445978884499994722' },
    { id: 126, title: "Hills Loop: Cycle Closet x Castelli",              url: 'https://www.strava.com/routes/3444238078013430898' },
    { id: 129, title: "Social Saturdays - Porties TDU Warm-Up",           url: 'https://www.strava.com/clubs/666018/group_events/3443104136757480728' },
    { id: 130, title: "Hills Explorer - Women's Stage 2",                  url: 'https://www.strava.com/clubs/666018/group_events/3443104808690536106' },
    { id: 131, title: "National KOS Outer Harbor Coffee Ride",             url: 'https://www.strava.com/clubs/666018/group_events/3443105800273397266' },
    { id: 132, title: "Annual Pilgrimage to Willunga Hill",                url: 'https://www.strava.com/clubs/666018/group_events/3443107591634979498' },
    { id: 145, title: "Group Ride (Short) Tour Village to Mt Lofty",       url: 'https://ridewithgps.com/routes/53708743' },
    { id: 146, title: "Group Ride (Short) Uraidla and Mt Osmond",         url: 'https://ridewithgps.com/routes/53467883' },
    { id: 147, title: "Group Ride (Short) Montacute Return",              url: 'https://ridewithgps.com/routes/44153846' },
    { id: 148, title: "Group Ride (Short) ADL to Mt Lofty",               url: 'https://ridewithgps.com/routes/44154096' },
    { id: 149, title: "Group Ride (Short) Tour Village to Belair",        url: 'https://www.strava.com/routes/3448167921158350664' },
    { id: 150, title: "Group Ride (Short) Henley Beach Return",           url: 'https://ridewithgps.com/routes/53781324' },
    { id: 151, title: "Group Ride (Short) Brighton Return",               url: 'https://ridewithgps.com/routes/49455167' },
    { id: 152, title: "Group Ride (Short) Stirling Return",               url: 'https://ridewithgps.com/routes/49475363' },
    { id: 175, title: "DASH - Willunga Ride",                             url: 'https://www.strava.com/routes/3442833484504788660' },
    { id: 191, title: "PPCC x MAAP - Waterfall Gully Warm-up",            url: 'https://www.strava.com/clubs/1334446/group_events/3435842322766293542' },
    { id: 194, title: "Simpatico - Brewvelo Bunchie TDU edition",         url: 'https://www.strava.com/clubs/1206369/group_events/3438329083734342896' },
    { id: 205, title: "ProVelo Stage 1 Time Trial",                       url: 'https://ridewithgps.com/routes/53788445' },
    { id: 206, title: "ProVelo Stage 2 Criterium",                        url: 'https://ridewithgps.com/routes/48978836' },
    { id: 231, title: "Santos TDU Group Ride - Sat Willunga Epic",        url: 'https://ridewithgps.com/routes/44154032' },
    { id: 232, title: "Group Ride (Long) Lenswood and Cudlee Creek",      url: 'https://www.strava.com/routes/3446271296508181658' },
    { id: 233, title: "Group Ride (Long) Norton Summit and Cuddlee Creek",url: 'https://ridewithgps.com/routes/53467867' },
    { id: 234, title: "Group Ride (Long) Verdun and Uraidla",             url: 'https://ridewithgps.com/routes/44154086' },
    { id: 235, title: "Group Ride (Long) Tour Village and Mylor",         url: 'https://ridewithgps.com/routes/53718041' },
    { id: 236, title: "Group Ride (Long) Nairne Return",                  url: 'https://www.strava.com/routes/3448077305635387256' },
    { id: 237, title: "Santos TDU Group Ride - Sun Willunga Epic",        url: 'https://ridewithgps.com/routes/53794447' },
    { id: 238, title: "Group Ride (Long) Tour Village to Mylor",          url: 'https://www.strava.com/routes/3447814884312818510' },
    { id: 281, title: "ProVelo Stage 2 Criterium (alt)",                  url: 'https://ridewithgps.com/routes/48978871' },
    { id: 287, title: "Adelaide Epic Ride - Medium Course",               url: 'https://ridewithgps.com/routes/51766222' },
    { id: 288, title: "Adelaide Epic Ride - Short Course",                url: 'https://ridewithgps.com/routes/51766173' },
    { id: 320, title: "KOM Hunting with Richie Porte",                    url: 'https://ridewithgps.com/routes/52058126' },
    { id: 322, title: "Wine Ride",                                        url: 'https://ridewithgps.com/routes/53467328' },
    { id: 324, title: "Willunga Hill Pilgrimage",                         url: 'https://ridewithgps.com/routes/53796089' },
    { id: 346, title: "Day 2 Ride - Willunga",                            url: 'https://www.strava.com/clubs/147976/group_events/3431841662623002966' },
    { id: 347, title: "Day 3 Ride - Lobethal",                            url: 'https://www.strava.com/clubs/147976/group_events/3431842141670424870' },
    { id: 348, title: "Day 4 Ride - Lofty",                               url: 'https://www.strava.com/clubs/147976/group_events/3431842292287484172' },
    { id: 349, title: "Day 5 Ride - Hahndorf",                            url: 'https://www.strava.com/clubs/147976/group_events/3431842635439083726' },
    { id: 350, title: "Day 6 Ride - Lyndoch",                             url: 'https://www.strava.com/clubs/147976/group_events/3431843018174902566' },
    { id: 351, title: "Day 7 Ride - Corkscrew",                           url: 'https://www.strava.com/clubs/147976/group_events/3431843184800798988' },
    { id: 352, title: "Day 8 Ride - Beaches",                             url: 'https://www.strava.com/clubs/147976/group_events/3431843329416625446' },
    { id: 353, title: "Day 9 Ride - ADL Special",                         url: 'https://www.strava.com/clubs/147976/group_events/3449552865696644492' },
    { id: 354, title: "Day 10 Ride - Stirling",                           url: 'https://www.strava.com/clubs/147976/group_events/3431843648352479500' },
];

// ─── URL classification ───────────────────────────────────────────────────────
function classifyUrl(url) {
    if (url.includes('strava.com/routes/')) return 'strava-route';
    if (url.includes('strava.com/clubs/') && url.includes('/group_events/')) return 'strava-event';
    if (url.includes('ridewithgps.com/routes/')) return 'ridewithgps';
    if (url.includes('tourdownunder.com.au/file-download')) return 'tdu-download';
    return 'unknown';
}

function extractRwgpsId(url) {
    const m = url.match(/ridewithgps\.com\/routes\/(\d+)/);
    return m ? m[1] : null;
}

// ─── HTTP fetch helper ────────────────────────────────────────────────────────
async function tryFetch(url) {
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TDUPlanner/1.0)' },
            redirect: 'follow',
            signal: AbortSignal.timeout(15000),
        });
        const contentType = res.headers.get('content-type') ?? '';
        const text = await res.text();
        return { ok: res.ok, status: res.status, contentType, body: text };
    } catch (err) {
        return { ok: false, status: 0, contentType: '', body: '', error: err.message };
    }
}

// ─── GPX/KML → GeoJSON ───────────────────────────────────────────────────────
function parseGpxKml(body, contentType) {
    const parser = new DOMParser();
    const isGpx = contentType.includes('gpx') || (body.includes('<?xml') && body.includes('<gpx'));
    const isKml = contentType.includes('kml') || body.includes('<kml') || body.includes('application/vnd.google-earth');
    if (isGpx) {
        const doc = parser.parseFromString(body, 'text/xml');
        return { format: 'gpx', geojson: gpx(doc) };
    }
    if (isKml) {
        const doc = parser.parseFromString(body, 'text/xml');
        return { format: 'kml', geojson: kml(doc) };
    }
    return null;
}

// ─── RideWithGPS JSON → GeoJSON LineString ────────────────────────────────────
function rwgpsToGeoJSON(data) {
    const points = data.track_points ?? [];
    if (points.length === 0) return null;

    const coordinates = points.map(p => {
        const coord = [p.x, p.y]; // [lng, lat]
        if (p.e !== undefined) coord.push(p.e); // elevation if present
        return coord;
    });

    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {
                name: data.name,
                distance_m: data.distance,
                elevation_gain_m: data.elevation_gain,
                elevation_loss_m: data.elevation_loss,
                source: 'ridewithgps',
                rwgps_id: data.id,
            },
            geometry: {
                type: 'LineString',
                coordinates,
            },
        }],
    };
}

// ─── Count coordinate points in a GeoJSON FeatureCollection ──────────────────
function countCoords(geojson) {
    let count = 0;
    for (const f of geojson.features ?? []) {
        const g = f.geometry;
        if (!g) continue;
        if (g.type === 'LineString') count += g.coordinates.length;
        else if (g.type === 'MultiLineString') count += g.coordinates.flat().length;
        else if (g.type === 'Point') count += 1;
    }
    return count;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const outDir = './scripts/geojson-samples';
mkdirSync(outDir, { recursive: true });

const results = { success: [], failed: [], skipped: [] };

for (const route of routes) {
    const type = classifyUrl(route.url);
    const label = `[${type.padEnd(14)}] [${String(route.id).padStart(3)}] ${route.title.substring(0, 45).padEnd(45)}`;

    // ── Strava routes: need OAuth ──────────────────────────────────────────────
    if (type === 'strava-route') {
        console.log(`${label} → SKIP (Strava OAuth required)`);
        results.skipped.push({ ...route, type, reason: 'strava-oauth' });
        continue;
    }

    // ── Strava group events: no geodata ───────────────────────────────────────
    if (type === 'strava-event') {
        console.log(`${label} → SKIP (group event page, no geodata)`);
        results.skipped.push({ ...route, type, reason: 'strava-event' });
        continue;
    }

    // ── RideWithGPS via public JSON API ───────────────────────────────────────
    if (type === 'ridewithgps') {
        const id = extractRwgpsId(route.url);
        const res = await tryFetch(`https://ridewithgps.com/routes/${id}.json`);
        if (!res.ok) {
            console.log(`${label} → FAIL HTTP ${res.status}`);
            results.failed.push({ ...route, type, reason: `HTTP ${res.status}` });
            continue;
        }
        let data;
        try { data = JSON.parse(res.body); } catch {
            console.log(`${label} → FAIL (JSON parse error)`);
            results.failed.push({ ...route, type, reason: 'json-parse' });
            continue;
        }
        const geojson = rwgpsToGeoJSON(data);
        if (!geojson) {
            console.log(`${label} → FAIL (no track_points)`);
            results.failed.push({ ...route, type, reason: 'no-track-points' });
            continue;
        }
        const coords = countCoords(geojson);
        console.log(`${label} → OK  LineString, ${coords} pts, ${(data.distance/1000).toFixed(1)} km`);
        results.success.push({ ...route, type, format: 'rwgps-json', coords, geojson });
        writeFileSync(`${outDir}/event-${route.id}.geojson`, JSON.stringify(geojson, null, 2));
        continue;
    }

    // ── TDU direct file downloads (GPX/KML) ───────────────────────────────────
    if (type === 'tdu-download') {
        const res = await tryFetch(route.url);
        if (!res.ok) {
            console.log(`${label} → FAIL HTTP ${res.status}`);
            results.failed.push({ ...route, type, reason: `HTTP ${res.status}` });
            continue;
        }
        const parsed = parseGpxKml(res.body, res.contentType);
        if (!parsed) {
            console.log(`${label} → FAIL (unknown format: ${res.contentType})`);
            results.failed.push({ ...route, type, reason: 'parse-failed' });
            continue;
        }
        const coords = countCoords(parsed.geojson);
        const lines = parsed.geojson.features?.filter(f => f.geometry?.type === 'LineString').length ?? 0;
        console.log(`${label} → OK  ${parsed.format.toUpperCase()}, ${lines} tracks, ${coords} pts`);
        results.success.push({ ...route, type, format: parsed.format, coords, geojson: parsed.geojson });
        writeFileSync(`${outDir}/event-${route.id}.geojson`, JSON.stringify(parsed.geojson, null, 2));
        continue;
    }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════');
console.log(`Total routes  : ${routes.length}`);
console.log(`✓ Converted   : ${results.success.length}`);
console.log(`✗ Failed      : ${results.failed.length}`);
console.log(`⊘ Skipped     : ${results.skipped.length}`);

const byReason = {};
for (const r of results.skipped) {
    byReason[r.reason] = (byReason[r.reason] ?? 0) + 1;
}
console.log('\nSkipped breakdown:');
for (const [reason, count] of Object.entries(byReason)) {
    console.log(`  ${reason}: ${count}`);
}

if (results.failed.length > 0) {
    console.log('\nFailed:');
    for (const r of results.failed) console.log(`  [${r.id}] ${r.title} — ${r.reason}`);
}

console.log(`\nGeoJSON files written to ${outDir}/`);
console.log('Next step: run the Strava OAuth flow to capture remaining routes,');
console.log('then add a route_geojson TEXT column to events and store results.');
