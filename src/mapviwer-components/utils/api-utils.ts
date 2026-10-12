import { CORS_PROXY } from '../config';
import type { WMSLayer, BBox } from '../config';

export const proxyFetch = async (url: string): Promise<Response> => {
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Proxy retornou ${response.status}`);
    return response;
};

export const parseWMSCapabilities = (xml: Document): WMSLayer[] => {
    const layersMap = new Map<string, WMSLayer>();
    const layerElements = xml.querySelectorAll('Layer > Layer');
    layerElements.forEach((layerEl) => {
        const name = layerEl.querySelector('Name')?.textContent;
        const title = layerEl.querySelector('Title')?.textContent;
        if (name && title) {
            if (!layersMap.has(name)) {
                layersMap.set(name, { name, title, abstract: layerEl.querySelector('Abstract')?.textContent || undefined });
            }
        }
    });
    if (layersMap.size === 0) {
        const allLayers = xml.querySelectorAll('Layer');
        allLayers.forEach((layerEl) => {
            const name = layerEl.querySelector('Name')?.textContent;
            const title = layerEl.querySelector('Title')?.textContent;
            if (name && title && !layersMap.has(name)) {
                layersMap.set(name, { name, title, abstract: layerEl.querySelector('Abstract')?.textContent || undefined });
            }
        });
    }
    return Array.from(layersMap.values());
};

export const parseWFSCapabilities = (xml: Document): WMSLayer[] => {
    const layersMap = new Map<string, WMSLayer>();
    const featureTypes = xml.querySelectorAll('FeatureType');
    featureTypes.forEach((ft) => {
        const name = ft.querySelector('Name')?.textContent;
        const title = ft.querySelector('Title')?.textContent;
        if (name && title && !layersMap.has(name)) layersMap.set(name, { name, title });
    });
    return Array.from(layersMap.values());
};

export const extractBBoxFromCapabilities = (xml: Document, layerName: string): BBox | null => {
    const featureTypes = Array.from(xml.querySelectorAll('FeatureType'));
    for (const ft of featureTypes) {
        const nameEl = ft.querySelector('Name')?.textContent?.trim() || '';
        if (nameEl !== layerName && !nameEl.endsWith(`:${layerName}`) && !layerName.endsWith(`:${nameEl}`)) continue;

        const llbb = ft.querySelector('LatLongBoundingBox');
        if (llbb) {
            const minx = parseFloat(llbb.getAttribute('minx') || '');
            const miny = parseFloat(llbb.getAttribute('miny') || '');
            const maxx = parseFloat(llbb.getAttribute('maxx') || '');
            const maxy = parseFloat(llbb.getAttribute('maxy') || '');
            if ([minx, miny, maxx, maxy].every(Number.isFinite)) return [minx, miny, maxx, maxy];
        }
        const wgs = ft.querySelector('WGS84BoundingBox');
        if (wgs) {
            const lower = wgs.querySelector('LowerCorner')?.textContent?.trim().split(/\s+/).map(Number);
            const upper = wgs.querySelector('UpperCorner')?.textContent?.trim().split(/\s+/).map(Number);
            if (lower && upper && lower.length === 2 && upper.length === 2 && lower.every(Number.isFinite) && upper.every(Number.isFinite)) {
                return [lower[0], lower[1], upper[0], upper[1]];
            }
        }
    }
    return null;
};