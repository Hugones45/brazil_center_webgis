// src/mapviwer-components/utils/export-utils.ts
import JSZip from 'jszip';
import { PRJ_4674 } from '../config';

const SHAPE_TYPE_POINT = 1;
const SHAPE_TYPE_POLYLINE = 3;
const SHAPE_TYPE_POLYGON = 5;

interface ShapefileRecord {
    shapeType: number;
    bbox: [number, number, number, number];
    parts: number[][][];
    points: number[][];
    point?: [number, number];
}

function explodeForShapefile(features: any[]): any[] {
    const out: any[] = [];
    for (const f of features) {
        if (!f || !f.geometry) continue;
        const t = f.geometry.type;
        if (t === 'MultiPoint') {
            for (const c of f.geometry.coordinates) {
                out.push({ type: 'Feature', properties: { ...(f.properties || {}) }, geometry: { type: 'Point', coordinates: c } });
            }
        } else {
            out.push(f);
        }
    }
    return out;
}

function featureToShapefileRecord(f: any): ShapefileRecord | null {
    const g = f.geometry;
    if (!g) return null;
    if (g.type === 'Point') {
        const [x, y] = g.coordinates;
        return { shapeType: SHAPE_TYPE_POINT, bbox: [x, y, x, y], parts: [], points: [], point: [x, y] };
    }
    if (g.type === 'LineString') {
        const pts = g.coordinates as number[][];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const [x, y] of pts) {
            if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
        }
        return { shapeType: SHAPE_TYPE_POLYLINE, bbox: [minX, minY, maxX, maxY], parts: [pts.slice()], points: pts.slice() };
    }
    if (g.type === 'MultiLineString') {
        const lines = g.coordinates as number[][][];
        const parts: number[][][] = lines.map(l => l.slice());
        const flat: number[][] = [];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const line of parts) {
            for (const [x, y] of line) {
                flat.push([x, y]);
                if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
            }
        }
        return { shapeType: SHAPE_TYPE_POLYLINE, bbox: [minX, minY, maxX, maxY], parts, points: flat };
    }
    if (g.type === 'Polygon') {
        const rings = (g.coordinates as number[][][]).map(r => r.slice().reverse());
        const flat: number[][] = [];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const ring of rings) {
            for (const [x, y] of ring) {
                flat.push([x, y]);
                if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
            }
        }
        return { shapeType: SHAPE_TYPE_POLYGON, bbox: [minX, minY, maxX, maxY], parts: rings, points: flat };
    }
    if (g.type === 'MultiPolygon') {
        const polys = g.coordinates as number[][][][];
        const rings: number[][][] = [];
        for (const poly of polys) {
            for (const ring of poly) {
                rings.push(ring.slice().reverse());
            }
        }
        const flat: number[][] = [];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const ring of rings) {
            for (const [x, y] of ring) {
                flat.push([x, y]);
                if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
            }
        }
        return { shapeType: SHAPE_TYPE_POLYGON, bbox: [minX, minY, maxX, maxY], parts: rings, points: flat };
    }
    return null;
}

function recordContentLength(r: ShapefileRecord): number {
    if (r.shapeType === SHAPE_TYPE_POINT) return 4 + 16;
    return 4 + 32 + 8 + 4 * r.parts.length + 16 * r.points.length;
}

function buildShp(records: ShapefileRecord[]): Uint8Array {
    let total = 100;
    for (const r of records) total += 8 + recordContentLength(r);
    const buf = new ArrayBuffer(total);
    const view = new DataView(buf);
    const bytes = new Uint8Array(buf);

    view.setInt32(0, 9994, false);
    view.setInt32(24, total / 2, false);
    view.setInt32(28, 1000, true);
    view.setInt32(32, records[0]?.shapeType ?? 0, true);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of records) {
        if (r.bbox[0] < minX) minX = r.bbox[0];
        if (r.bbox[1] < minY) minY = r.bbox[1];
        if (r.bbox[2] > maxX) maxX = r.bbox[2];
        if (r.bbox[3] > maxY) maxY = r.bbox[3];
    }
    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 0; maxY = 0; }
    view.setFloat64(36, minX, true); view.setFloat64(44, minY, true);
    view.setFloat64(52, maxX, true); view.setFloat64(60, maxY, true);

    let off = 100;
    for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const contentLen = recordContentLength(r);
        view.setInt32(off, i + 1, false); off += 4;
        view.setInt32(off, contentLen / 2, false); off += 4;
        view.setInt32(off, r.shapeType, true); off += 4;

        if (r.shapeType === SHAPE_TYPE_POINT) {
            view.setFloat64(off, r.point![0], true); off += 8;
            view.setFloat64(off, r.point![1], true); off += 8;
        } else {
            view.setFloat64(off, r.bbox[0], true); off += 8;
            view.setFloat64(off, r.bbox[1], true); off += 8;
            view.setFloat64(off, r.bbox[2], true); off += 8;
            view.setFloat64(off, r.bbox[3], true); off += 8;
            view.setInt32(off, r.parts.length, true); off += 4;
            view.setInt32(off, r.points.length, true); off += 4;

            let idx = 0;
            for (const p of r.parts) { view.setInt32(off, idx, true); off += 4; idx += p.length; }
            for (const [x, y] of r.points) { view.setFloat64(off, x, true); off += 8; view.setFloat64(off, y, true); off += 8; }
        }
    }
    return bytes;
}

function buildShx(records: ShapefileRecord[]): Uint8Array {
    const total = 100 + 8 * records.length;
    const buf = new ArrayBuffer(total);
    const view = new DataView(buf);
    view.setInt32(0, 9994, false);
    view.setInt32(24, total / 2, false);
    view.setInt32(28, 1000, true);
    view.setInt32(32, records[0]?.shapeType ?? 0, true);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of records) {
        if (r.bbox[0] < minX) minX = r.bbox[0];
        if (r.bbox[1] < minY) minY = r.bbox[1];
        if (r.bbox[2] > maxX) maxX = r.bbox[2];
        if (r.bbox[3] > maxY) maxY = r.bbox[3];
    }
    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 0; maxY = 0; }
    view.setFloat64(36, minX, true); view.setFloat64(44, minY, true);
    view.setFloat64(52, maxX, true); view.setFloat64(60, maxY, true);

    let shpOff = 100; let off = 100;
    for (const r of records) {
        const contentLen = recordContentLength(r);
        view.setInt32(off, shpOff / 2, false); off += 4;
        view.setInt32(off, contentLen / 2, false); off += 4;
        shpOff += 8 + contentLen;
    }
    return new Uint8Array(buf);
}

function buildDbf(features: any[]): Uint8Array {
    const keys: string[] = [];
    const seen = new Set<string>();
    for (const f of features) {
        if (f.properties) {
            for (const k of Object.keys(f.properties)) {
                if (!seen.has(k)) { seen.add(k); keys.push(k); }
            }
        }
    }
    const used = new Map<string, number>();
    const fieldNames: string[] = [];
    for (const k of keys) {
        let n = k.toUpperCase().replace(/[^A-Z0-9_]/g, '_').substring(0, 10) || 'F';
        const prior = used.get(n) || 0;
        used.set(n, prior + 1);
        if (prior > 0) { const suffix = String(prior); n = n.substring(0, Math.max(1, 10 - suffix.length)) + suffix; }
        fieldNames.push(n);
    }
    const fields = keys.map((k, i) => {
        let numeric = true, maxLen = 1, maxDec = 0;
        for (const f of features) {
            const v = f.properties ? f.properties[k] : undefined;
            if (v === null || v === undefined) continue;
            if (typeof v === 'number') {
                const s = String(v);
                if (s.length > maxLen) maxLen = s.length;
                const dot = s.indexOf('.');
                if (dot >= 0) { const dec = s.length - dot - 1; if (dec > maxDec) maxDec = dec; }
            } else if (typeof v === 'boolean') {
                numeric = false; if (5 > maxLen) maxLen = 5;
            } else {
                numeric = false; const s = String(v); if (s.length > maxLen) maxLen = s.length;
            }
        }
        if (numeric) { if (maxLen > 18) maxLen = 18; } else { if (maxLen > 254) maxLen = 254; }
        return { name: fieldNames[i], type: numeric ? 'N' : 'C', length: Math.max(1, maxLen), decimals: numeric ? Math.min(maxDec, 15) : 0 };
    });

    if (fields.length === 0) fields.push({ name: 'ID', type: 'N', length: 10, decimals: 0 });

    const headerSize = 32 + fields.length * 32 + 1;
    const recordSize = 1 + fields.reduce((s, f) => s + f.length, 0);
    const totalSize = headerSize + recordSize * features.length + 1;
    const buf = new ArrayBuffer(totalSize);
    const view = new DataView(buf);
    const bytes = new Uint8Array(buf);

    const now = new Date();
    view.setUint8(0, 0x03); view.setUint8(1, now.getFullYear() - 1900);
    view.setUint8(2, now.getMonth() + 1); view.setUint8(3, now.getDate());
    view.setInt32(4, features.length, true); view.setInt16(8, headerSize, true); view.setInt16(10, recordSize, true);

    let off = 32;
    for (const f of fields) {
        for (let i = 0; i < 11; i++) bytes[off + i] = i < f.name.length ? f.name.charCodeAt(i) : 0;
        bytes[off + 11] = f.type.charCodeAt(0); bytes[off + 16] = f.length & 0xff; bytes[off + 17] = f.decimals & 0xff;
        off += 32;
    }
    bytes[off] = 0x0d; off += 1;

    for (const feat of features) {
        bytes[off] = 0x20; off += 1;
        for (let i = 0; i < fields.length; i++) {
            const fl = fields[i];
            const v = feat.properties ? feat.properties[keys[i]] : undefined;
            let str: string;
            if (v === null || v === undefined) str = '';
            else if (fl.type === 'N') {
                const num = Number(v);
                if (!isFinite(num)) str = '';
                else if (fl.decimals > 0) str = num.toFixed(fl.decimals);
                else str = String(Math.round(num));
            } else str = String(v);

            if (str.length > fl.length) str = str.substring(0, fl.length);
            str = fl.type === 'N' ? str.padStart(fl.length, ' ') : str.padEnd(fl.length, ' ');
            for (let j = 0; j < fl.length; j++) bytes[off + j] = str.charCodeAt(j) & 0xff;
            off += fl.length;
        }
    }
    bytes[off] = 0x1a;
    return bytes;
}

export async function buildShapefileZip(features: any[], layerName: string): Promise<Blob> {
    const exploded = explodeForShapefile(features);
    const families: Record<string, any[]> = {};
    for (const f of exploded) {
        const t = f.geometry.type;
        const fam = t === 'Point' ? 'point' : (t === 'LineString' || t === 'MultiLineString') ? 'line' : (t === 'Polygon' || t === 'MultiPolygon') ? 'polygon' : null;
        if (!fam) continue;
        (families[fam] ||= []).push(f);
    }

    const zip = new JSZip();
    const base = (layerName || 'layer').replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 50) || 'layer';
    const familyNames = Object.keys(families);
    const multi = familyNames.length > 1;

    for (const fam of familyNames) {
        const feats = families[fam];
        const records: ShapefileRecord[] = [];
        for (const f of feats) { const r = featureToShapefileRecord(f); if (r) records.push(r); }
        if (records.length === 0) continue;

        const fileBase = multi ? `${base}_${fam}` : base;
        zip.file(`${fileBase}.shp`, buildShp(records));
        zip.file(`${fileBase}.shx`, buildShx(records));
        zip.file(`${fileBase}.dbf`, buildDbf(feats));
        zip.file(`${fileBase}.prj`, PRJ_4674);
        zip.file(`${fileBase}.cpg`, 'ISO-8859-1');
    }
    return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

function kmlEscape(str: string): string {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function kmlCoords(coords: number[][]): string {
    return coords.map(([lon, lat]) => `${lon},${lat},0`).join(' ');
}

function kmlPolygon(rings: number[][][]): string {
    if (!rings || rings.length === 0) return '';
    const outer = rings[0];
    const inner = rings.slice(1);
    let s = '<Polygon><tessellate>1</tessellate>';
    s += `<outerBoundaryIs><LinearRing><coordinates>${kmlCoords(outer)}</coordinates></LinearRing></outerBoundaryIs>`;
    for (const r of inner) s += `<innerBoundaryIs><LinearRing><coordinates>${kmlCoords(r)}</coordinates></LinearRing></innerBoundaryIs>`;
    s += '</Polygon>';
    return s;
}

function kmlGeometry(geometry: any): string {
    if (!geometry) return '';
    const t = geometry.type;
    if (t === 'Point') return `<Point><coordinates>${kmlCoords([geometry.coordinates])}</coordinates></Point>`;
    if (t === 'MultiPoint') return `<MultiGeometry>${(geometry.coordinates as number[][]).map(c => `<Point><coordinates>${kmlCoords([c])}</coordinates></Point>`).join('')}</MultiGeometry>`;
    if (t === 'LineString') return `<LineString><tessellate>1</tessellate><coordinates>${kmlCoords(geometry.coordinates)}</coordinates></LineString>`;
    if (t === 'MultiLineString') return `<MultiGeometry>${(geometry.coordinates as number[][][]).map(c => `<LineString><tessellate>1</tessellate><coordinates>${kmlCoords(c)}</coordinates></LineString>`).join('')}</MultiGeometry>`;
    if (t === 'Polygon') return kmlPolygon(geometry.coordinates);
    if (t === 'MultiPolygon') return `<MultiGeometry>${(geometry.coordinates as number[][][][]).map(rings => kmlPolygon(rings)).join('')}</MultiGeometry>`;
    return '';
}

export function buildKml(features: any[], layerName: string): string {
    const parts: string[] = [];
    parts.push('<?xml version="1.0" encoding="UTF-8"?>');
    parts.push('<kml xmlns="http://www.opengis.net/kml/2.2">');
    parts.push('<Document>');
    parts.push(`<name>${kmlEscape(layerName || 'layer')}</name>`);

    for (const f of features) {
        if (!f || !f.geometry) continue;
        const geomXml = kmlGeometry(f.geometry);
        if (!geomXml) continue;

        parts.push('<Placemark>');
        const props = f.properties || {};
        const preferredNameKeys = ['name', 'Name', 'NAME', 'nome', 'Nome', 'NOME', 'title', 'Title'];
        let placemarkName: string | undefined;
        for (const k of preferredNameKeys) {
            if (props[k] !== undefined && props[k] !== null && String(props[k]).length > 0) { placemarkName = String(props[k]); break; }
        }
        if (placemarkName !== undefined) parts.push(`<name>${kmlEscape(placemarkName)}</name>`);

        const propKeys = Object.keys(props);
        if (propKeys.length > 0) {
            parts.push('<ExtendedData>');
            for (const k of propKeys) {
                const v = props[k];
                if (v === null || v === undefined) continue;
                parts.push(`<Data name="${kmlEscape(k)}"><value>${kmlEscape(String(v))}</value></Data>`);
            }
            parts.push('</ExtendedData>');
        }
        parts.push(geomXml);
        parts.push('</Placemark>');
    }
    parts.push('</Document>');
    parts.push('</kml>');
    return parts.join('\n');
}

export function convertToCSV(features: any[]): string {
    if (features.length === 0) return '';
    const headers = Object.keys(features[0].properties);
    const csvRows = [headers.join(',')];
    features.forEach(feature => {
        const values = headers.map(header => {
            const val = feature.properties[header];
            const strVal = val !== null && val !== undefined ? String(val) : '';
            return `"${strVal.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    });
    return csvRows.join('\n');
}