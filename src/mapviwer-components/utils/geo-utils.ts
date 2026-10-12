// src/mapviwer-components/utils/geo-utils.ts
import { intersect } from '@turf/intersect';
import { featureCollection } from '@turf/helpers';
import booleanIntersects from '@turf/boolean-intersects';
import lineIntersect from '@turf/line-intersect';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import midpoint from '@turf/midpoint';
import type { BBox } from '../config';

export const asFeature = (geometry: any, properties: any, id?: any): any => ({
    type: 'Feature',
    ...(id !== undefined ? { id } : {}),
    properties: properties || {},
    geometry,
});

export const bboxFromFeatures = (features: any[]): BBox | null => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let found = false;
    const visitCoords = (coords: any) => {
        if (typeof coords[0] === 'number') {
            const [x, y] = coords;
            if (typeof x === 'number' && typeof y === 'number' && isFinite(x) && isFinite(y)) {
                if (x < minX) minX = x; if (y < minY) minY = y;
                if (x > maxX) maxX = x; if (y > maxY) maxY = y;
                found = true;
            }
        } else if (Array.isArray(coords)) {
            for (const c of coords) visitCoords(c);
        }
    };
    for (const f of features) { if (f && f.geometry && f.geometry.coordinates) visitCoords(f.geometry.coordinates); }
    if (!found) return null;
    return [minX, minY, maxX, maxY];
};

export const mergeBBoxes = (boxes: (BBox | null)[]): BBox | null => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let found = false;
    for (const b of boxes) {
        if (!b) continue;
        const [a, c, d, e] = b;
        if (a < minX) minX = a; if (c < minY) minY = c;
        if (d > maxX) maxX = d; if (e > maxY) maxY = e;
        found = true;
    }
    return found ? [minX, minY, maxX, maxY] : null;
};

const clipPolygonFeature = (feat: any, polygonFeature: any): GeoJSON.Feature[] => {
    let clipped: any = null;
    try {
        clipped = intersect(featureCollection([asFeature(feat.geometry, feat.properties, feat.id), polygonFeature]));
    } catch (e) { return []; }
    if (!clipped || !clipped.geometry) return [];
    return [asFeature(clipped.geometry, feat.properties, feat.id)];
};

const samePoint = (a: number[], b: number[], eps = 1e-9) => Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps;

const spliceCrossingsIntoLine = (coords: number[][], crossings: number[][]): number[][] => {
    if (crossings.length === 0) return coords.slice();
    type Pt = { coord: number[]; dist: number };
    const points: Pt[] = [];
    const segStartDist: number[] = [0];
    for (let i = 1; i < coords.length; i++) {
        const dx = coords[i][0] - coords[i - 1][0]; const dy = coords[i][1] - coords[i - 1][1];
        segStartDist.push(segStartDist[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    const totalLen = segStartDist[segStartDist.length - 1];
    for (const c of crossings) {
        let bestSeg = -1; let bestDistAlongSeg = Infinity; let bestDistanceSq = Infinity;
        for (let i = 0; i < coords.length - 1; i++) {
            const a = coords[i]; const b = coords[i + 1];
            const vx = b[0] - a[0]; const vy = b[1] - a[1];
            const wx = c[0] - a[0]; const wy = c[1] - a[1];
            const segLenSq = vx * vx + vy * vy;
            let t = segLenSq === 0 ? 0 : (wx * vx + wy * vy) / segLenSq;
            if (t < 0) t = 0; if (t > 1) t = 1;
            const projX = a[0] + t * vx; const projY = a[1] + t * vy;
            const dxp = c[0] - projX; const dyp = c[1] - projY;
            const dSq = dxp * dxp + dyp * dyp;
            if (dSq < bestDistanceSq) { bestDistanceSq = dSq; bestSeg = i; bestDistAlongSeg = t; }
        }
        if (bestSeg === -1) continue;
        const segLen = Math.sqrt(Math.pow(coords[bestSeg + 1][0] - coords[bestSeg][0], 2) + Math.pow(coords[bestSeg + 1][1] - coords[bestSeg][1], 2));
        const dist = segStartDist[bestSeg] + bestDistAlongSeg * segLen;
        points.push({ coord: [c[0], c[1]], dist: Math.min(dist, totalLen) });
    }
    const merged: Pt[] = [];
    for (let i = 0; i < coords.length; i++) merged.push({ coord: coords[i], dist: segStartDist[i] });
    for (const p of points) merged.push(p);
    merged.sort((a, b) => a.dist - b.dist);
    const out: number[][] = [];
    for (const p of merged) {
        if (out.length === 0) out.push(p.coord);
        else if (!samePoint(out[out.length - 1], p.coord)) out.push(p.coord);
    }
    return out;
};

const splitLineAtCrossings = (enriched: number[][], crossings: number[][]): number[][][] => {
    if (crossings.length === 0) return [enriched];
    const crossingIndices: number[] = [];
    for (let i = 0; i < enriched.length; i++) {
        for (const c of crossings) { if (samePoint(enriched[i], c, 1e-9)) { crossingIndices.push(i); break; } }
    }
    if (crossingIndices.length === 0) return [enriched];
    const uniqueIndices = Array.from(new Set(crossingIndices)).sort((a, b) => a - b);
    const pieces: number[][][] = [];
    let start = 0;
    for (const idx of uniqueIndices) { if (idx > start) pieces.push(enriched.slice(start, idx + 1)); start = idx; }
    if (start < enriched.length - 1) pieces.push(enriched.slice(start));
    return pieces.filter(p => p.length >= 2);
};

const clipSingleLine = (coords: number[][], polygonFeature: any): number[][][] => {
    if (!coords || coords.length < 2) return [];
    const lineFeature = asFeature({ type: 'LineString', coordinates: coords }, {});
    let overlaps = false;
    try { overlaps = booleanIntersects(lineFeature as any, polygonFeature as any); } catch (e) { overlaps = true; }
    if (!overlaps) return [];
    let crossings: number[][] = [];
    try {
        const res = lineIntersect(lineFeature as any, polygonFeature as any);
        crossings = (res?.features || []).map((f: any) => f.geometry.coordinates as number[]);
    } catch (e) { crossings = []; }
    const enriched = spliceCrossingsIntoLine(coords, crossings);
    const pieces = splitLineAtCrossings(enriched, crossings);
    const survivors: number[][][] = [];
    for (const piece of pieces) {
        if (piece.length < 2) continue;
        let inside = false;
        try {
            const first = piece[0]; const last = piece[piece.length - 1];
            const mid = midpoint(asFeature({ type: 'Point', coordinates: first }, {}) as any, asFeature({ type: 'Point', coordinates: last }, {}) as any);
            inside = booleanPointInPolygon(mid as any, polygonFeature as any);
            if (!inside) inside = piece.some(c => booleanPointInPolygon(asFeature({ type: 'Point', coordinates: c }, {}) as any, polygonFeature as any));
        } catch (e) { inside = false; }
        if (inside) survivors.push(piece);
    }
    return survivors;
};

const clipLineFeature = (feat: any, polygonFeature: any): GeoJSON.Feature[] => {
    const geomType = feat.geometry.type;
    const allSurvivors: number[][][] = [];
    if (geomType === 'LineString') {
        const survivors = clipSingleLine(feat.geometry.coordinates, polygonFeature);
        for (const s of survivors) allSurvivors.push(s);
    } else if (geomType === 'MultiLineString') {
        for (const partCoords of feat.geometry.coordinates) {
            const survivors = clipSingleLine(partCoords, polygonFeature);
            for (const s of survivors) allSurvivors.push(s);
        }
    } else return [];
    if (allSurvivors.length === 0) return [];
    if (allSurvivors.length === 1) return [asFeature({ type: 'LineString', coordinates: allSurvivors[0] }, feat.properties, feat.id)];
    return [asFeature({ type: 'MultiLineString', coordinates: allSurvivors }, feat.properties, feat.id)];
};

const clipPointFeature = (feat: any, polygonFeature: any): GeoJSON.Feature[] => {
    if (feat.geometry.type === 'Point') {
        try {
            const inside = booleanPointInPolygon(asFeature(feat.geometry, {}) as any, polygonFeature as any);
            if (inside) return [asFeature(feat.geometry, feat.properties, feat.id)];
        } catch (e) {}
        return [];
    }
    if (feat.geometry.type === 'MultiPoint') {
        const kept: number[][] = [];
        for (const c of feat.geometry.coordinates) {
            try {
                const inside = booleanPointInPolygon(asFeature({ type: 'Point', coordinates: c }, {}) as any, polygonFeature as any);
                if (inside) kept.push(c);
            } catch (e) {}
        }
        if (kept.length === 0) return [];
        if (kept.length === 1) return [asFeature({ type: 'Point', coordinates: kept[0] }, feat.properties, feat.id)];
        return [asFeature({ type: 'MultiPoint', coordinates: kept }, feat.properties, feat.id)];
    }
    return [];
};

export const clipFeaturesToPolygon = (features: any[], drawnPolygon: GeoJSON.Polygon): GeoJSON.Feature[] => {
    const polygonFeature = asFeature(drawnPolygon, {});
    const out: GeoJSON.Feature[] = [];
    for (const feat of features) {
        if (!feat || !feat.geometry) continue;
        const t = feat.geometry.type;
        if (t === 'Polygon' || t === 'MultiPolygon') out.push(...clipPolygonFeature(feat, polygonFeature));
        else if (t === 'LineString' || t === 'MultiLineString') out.push(...clipLineFeature(feat, polygonFeature));
        else if (t === 'Point' || t === 'MultiPoint') out.push(...clipPointFeature(feat, polygonFeature));
    }
    return out;
};