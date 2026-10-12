// src/pages/MapViwer.tsx
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState, useCallback } from "react";
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';

// Config & Utilities
import {
    LIGHT_STYLE, DARK_STYLE, SATELLITE_STYLE, BASEMAP_LAYER_IDS, BASEMAP_SOURCE_IDS,
    SERVER_OPTIONS, CORS_PROXY
} from '../mapviwer-components/config';
import type { WMSLayer, FeatureProperties } from '../mapviwer-components/config';
import {
    proxyFetch, parseWMSCapabilities, parseWFSCapabilities, extractBBoxFromCapabilities
} from '../mapviwer-components/utils/api-utils';
import {
    bboxFromFeatures, mergeBBoxes, clipFeaturesToPolygon
} from '../mapviwer-components/utils/geo-utils';
import {
    buildShapefileZip, buildKml, convertToCSV
} from '../mapviwer-components/utils/export-utils';

// Components
import { ServerPanel } from '../mapviwer-components/ServerPanel';
import { LayersPanel } from '../mapviwer-components/LayersPanel';
import { AttributeTable } from '../mapviwer-components/AttributeTable';

const MapViwer = () => {
    const mapRef = useRef<maplibregl.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const drawRef = useRef<TerraDraw | null>(null);

    const [isReady, setIsReady] = useState<boolean>(false);

    const [selectedServer, setSelectedServer] = useState(SERVER_OPTIONS[0]);
    const [customUrl, setCustomUrl] = useState('');
    const [geoserverUrl, setGeoserverUrl] = useState(SERVER_OPTIONS[0].url);
    const [baseUrl, setBaseUrl] = useState(SERVER_OPTIONS[0].url);
    const [needsProxy, setNeedsProxy] = useState(true);

    const [layers, setLayers] = useState<WMSLayer[]>([]);
    const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloadingLayer, setDownloadingLayer] = useState<string | null>(null);
    const [showServerPanel, setShowServerPanel] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

    const [serverSearch, setServerSearch] = useState('');
    const [layerSearch, setLayerSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const [activeTab, setActiveTab] = useState<'all' | 'selected'>('all');

    const [showTable, setShowTable] = useState(false);
    const [selectedLayerForTable, setSelectedLayerForTable] = useState<string | null>(null);
    const [tableData, setTableData] = useState<FeatureProperties[]>([]);
    const [tableColumns, setTableColumns] = useState<string[]>([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [tableError, setTableError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const [tableHeight, setTableHeight] = useState(35);
    const isDraggingRef = useRef(false);
    const dragStartYRef = useRef(0);
    const startHeightRef = useRef(0);

    const currentServerLayersRef = useRef<Set<string>>(new Set());

    const [drawingEnabled, setDrawingEnabled] = useState(false);
    const [spatialFilter, setSpatialFilter] = useState<GeoJSON.Geometry | null>(null);

    const [activeBasemap, setActiveBasemap] = useState<'light' | 'dark' | 'satellite'>('satellite');
    const [serverPanelCollapsed, setServerPanelCollapsed] = useState(false);
    const [layersPanelCollapsed, setLayersPanelCollapsed] = useState(false);

    const spatialFilterRef = useRef<GeoJSON.Geometry | null>(null);
    useEffect(() => { spatialFilterRef.current = spatialFilter; }, [spatialFilter]);

    const filteredServers = SERVER_OPTIONS.filter(server =>
        server.label.toLowerCase().includes(serverSearch.toLowerCase()) ||
        server.url.toLowerCase().includes(serverSearch.toLowerCase())
    );

    const filteredLayers = layers.filter(layer =>
        layer.title.toLowerCase().includes(layerSearch.toLowerCase()) ||
        layer.name.toLowerCase().includes(layerSearch.toLowerCase()) ||
        (layer.abstract && layer.abstract.toLowerCase().includes(layerSearch.toLowerCase()))
    );

    const activeLayersList = layers.filter(layer => activeLayers.has(layer.name));

    const filteredActiveLayers = activeLayersList.filter(layer =>
        layer.title.toLowerCase().includes(layerSearch.toLowerCase()) ||
        layer.name.toLowerCase().includes(layerSearch.toLowerCase()) ||
        (layer.abstract && layer.abstract.toLowerCase().includes(layerSearch.toLowerCase()))
    );

    const cleanupAllLayers = useCallback(() => {
        if (!mapRef.current) return;
        currentServerLayersRef.current.forEach(layerName => {
            try {
                if (mapRef.current?.getLayer(layerName)) mapRef.current.removeLayer(layerName);
                if (mapRef.current?.getSource(layerName)) mapRef.current.removeSource(layerName);
            } catch (e) { }
        });
        currentServerLayersRef.current.clear();
        if (drawRef.current) {
            try { drawRef.current.clear(); } catch (e) { }
            setSpatialFilter(null);
            setDrawingEnabled(false);
        }
    }, []);

    const handleDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        dragStartYRef.current = e.clientY;
        startHeightRef.current = tableHeight;
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    }, [tableHeight]);

    const handleDragMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const deltaY = dragStartYRef.current - e.clientY;
        const viewportHeight = window.innerHeight;
        const deltaPercent = (deltaY / viewportHeight) * 100;
        const newHeight = startHeightRef.current + deltaPercent;
        const clampedHeight = Math.min(Math.max(newHeight, 20), 85);
        setTableHeight(clampedHeight);
    }, []);

    const handleDragEnd = useCallback(() => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, [handleDragMove]);

    const handleDrawCreate = useCallback((e: { features: GeoJSON.Feature[] }) => {
        const feature = e.features[0];
        if (feature.geometry.type === 'Polygon') {
            setSpatialFilter(feature.geometry);
            setDrawingEnabled(false);
            if (selectedLayerForTable) fetchFilteredData(selectedLayerForTable, feature.geometry);
        }
    }, [selectedLayerForTable]);

    const handleDrawUpdate = useCallback((e: { features: GeoJSON.Feature[] }) => {
        const feature = e.features[0];
        if (feature.geometry.type === 'Polygon') {
            setSpatialFilter(feature.geometry);
            if (selectedLayerForTable) fetchFilteredData(selectedLayerForTable, feature.geometry);
        }
    }, [selectedLayerForTable]);

    const handleDrawDelete = useCallback(() => {
        setSpatialFilter(null);
        setDrawingEnabled(false);
        if (selectedLayerForTable) openAttributeTable(selectedLayerForTable);
    }, [selectedLayerForTable]);

    const handleDrawCreateRef = useRef(handleDrawCreate);
    const handleDrawUpdateRef = useRef(handleDrawUpdate);
    const handleDrawDeleteRef = useRef(handleDrawDelete);

    useEffect(() => { handleDrawCreateRef.current = handleDrawCreate; }, [handleDrawCreate]);
    useEffect(() => { handleDrawUpdateRef.current = handleDrawUpdate; }, [handleDrawUpdate]);
    useEffect(() => { handleDrawDeleteRef.current = handleDrawDelete; }, [handleDrawDelete]);

    // ========================================================================
    // ✅ FIX CRÍTICO: Aplica manualmente as cores (paint) nas camadas do
    // TerraDraw. Necessário porque em builds de produção o
    // terra-draw-maplibre-gl-adapter deixa o `paint` vazio, tornando o
    // polígono invisível. Em dev funciona, em prod não.
    // ========================================================================
    const applyTerraDrawPaint = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;
        try {
            if (map.getLayer('td-polygon')) {
                map.setPaintProperty('td-polygon', 'fill-color', ['get', 'polygonFillColor']);
                map.setPaintProperty('td-polygon', 'fill-opacity', ['coalesce', ['get', 'polygonFillOpacity'], 0.3]);
            }
            if (map.getLayer('td-polygon-outline')) {
                map.setPaintProperty('td-polygon-outline', 'line-color', ['get', 'polygonOutlineColor']);
                map.setPaintProperty('td-polygon-outline', 'line-width', ['coalesce', ['get', 'polygonOutlineWidth'], 3]);
                map.setPaintProperty('td-polygon-outline', 'line-opacity', ['coalesce', ['get', 'polygonOutlineOpacity'], 1]);
            }
            if (map.getLayer('td-linestring')) {
                map.setPaintProperty('td-linestring', 'line-color', ['get', 'lineStringColor']);
                map.setPaintProperty('td-linestring', 'line-width', ['coalesce', ['get', 'lineStringWidth'], 3]);
            }
            if (map.getLayer('td-point')) {
                map.setPaintProperty('td-point', 'circle-color', ['get', 'pointColor']);
                map.setPaintProperty('td-point', 'circle-radius', ['coalesce', ['get', 'pointWidth'], 6]);
            }
        } catch (e) {
            console.error('❌ Erro ao aplicar paint:', e);
        }
    }, []);

    const bringDrawLayersToFront = useCallback(() => {
        if (!mapRef.current) return;
        const style = mapRef.current.getStyle();
        if (!style || !style.layers) return;
        const ids = style.layers.map((l: any) => l.id as string);
        ids.forEach((id) => {
            if (typeof id !== 'string') return;
            if (!id.startsWith('td-')) return;
            try { if (mapRef.current?.getLayer(id)) mapRef.current.moveLayer(id); } catch (e) { }
        });
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current) return;
        const theBaseMap = new maplibregl.Map({
            container: mapContainerRef.current,
            center: [-53.5, -18.5],
            zoom: 3.5,
            style: SATELLITE_STYLE
        });
        mapRef.current = theBaseMap;

        theBaseMap.on("load", () => {
            setIsReady(true);
            try {
                const draw = new TerraDraw({
                    adapter: new TerraDrawMapLibreGLAdapter({ map: theBaseMap as any }),
                    modes: [
                        new TerraDrawPolygonMode({
                            styles: {
                                fillColor: '#1976D2', fillOpacity: 0.3, outlineColor: '#1976D2', outlineWidth: 3, outlineOpacity: 1,
                                closingPointColor: '#FFFFFF', closingPointWidth: 8, closingPointOutlineColor: '#1976D2', closingPointOutlineWidth: 3,
                                coordinatePointColor: '#FFFFFF', coordinatePointWidth: 8, coordinatePointOutlineColor: '#1976D2', coordinatePointOutlineWidth: 3,
                                editedPointColor: '#FFFFFF', editedPointWidth: 8, editedPointOutlineColor: '#1976D2', editedPointOutlineWidth: 3
                            }
                        } as any),
                        new TerraDrawSelectMode({
                            flags: { polygon: { feature: { draggable: true, coordinates: { midpoints: true, draggable: true, deletable: true } } } },
                            styles: {
                                selectedPolygonColor: '#1976D2', selectedPolygonFillOpacity: 0.35, selectedPolygonOutlineColor: '#1976D2', selectedPolygonOutlineWidth: 3,
                                selectionPointColor: '#FFFFFF', selectionPointWidth: 8, selectionPointOutlineColor: '#1976D2', selectionPointOutlineWidth: 3
                            }
                        } as any)
                    ]
                });
                draw.start();
                draw.setMode('select');
                drawRef.current = draw;

                // ✅ FIX: aplica o paint assim que as camadas existirem
                const paintInterval = setInterval(() => {
                    if (mapRef.current?.getLayer('td-polygon')) {
                        applyTerraDrawPaint();
                        clearInterval(paintInterval);
                    }
                }, 100);
                setTimeout(() => clearInterval(paintInterval), 3000);

                setTimeout(() => { applyTerraDrawPaint(); bringDrawLayersToFront(); }, 50);
                setTimeout(() => { applyTerraDrawPaint(); bringDrawLayersToFront(); }, 200);

                draw.on('finish', (id: string | number) => {
                    try {
                        const snapshot: any[] = draw.getSnapshot();
                        const feature = snapshot.find((f: any) => f.id === id);
                        if (feature && feature.geometry && feature.geometry.type === 'Polygon') {
                            const asGeoJSONFeature = { type: 'Feature', properties: feature.properties || {}, geometry: feature.geometry };
                            if (spatialFilterRef.current) handleDrawUpdateRef.current({ features: [asGeoJSONFeature as any] });
                            else handleDrawCreateRef.current({ features: [asGeoJSONFeature as any] });
                            try { draw.setMode('select'); } catch (e) { }
                        }
                    } catch (e) { console.error('[TERRADRAW] Erro no finish:', e); }
                    applyTerraDrawPaint();
                    setTimeout(() => { applyTerraDrawPaint(); bringDrawLayersToFront(); }, 50);
                    setTimeout(() => { applyTerraDrawPaint(); bringDrawLayersToFront(); }, 200);
                });

                draw.on('change', () => {
                    applyTerraDrawPaint();
                    bringDrawLayersToFront();
                    try {
                        const mode = (draw as any).getMode ? (draw as any).getMode() : null;
                        if (mode === 'polygon') return;
                        const snapshot: any[] = draw.getSnapshot();
                        if (snapshot.length === 0) return;
                        const poly = snapshot.find((f: any) => f.geometry && f.geometry.type === 'Polygon');
                        if (poly) setSpatialFilter(poly.geometry);
                    } catch (e) { }
                });
            } catch (e) {
                console.error('[TERRADRAW] ❌ ERRO FATAL:', e);
            }
            applyTerraDrawPaint();
            setTimeout(() => bringDrawLayersToFront(), 200);
        });

        return () => {
            if (drawRef.current) { try { drawRef.current.stop(); } catch (e) { } }
            theBaseMap.remove();
            mapRef.current = null;
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
        };
    }, [applyTerraDrawPaint, bringDrawLayersToFront]);

    useEffect(() => {
        if (!geoserverUrl) return;
        cleanupAllLayers();
        setLayers([]); setActiveLayers(new Set()); setLayerSearch(''); setActiveTab('all'); setShowTable(false);
        const bUrl = geoserverUrl.includes('?') ? geoserverUrl.substring(0, geoserverUrl.indexOf('?')) : geoserverUrl;
        const finalBaseUrl = bUrl.endsWith('/') ? bUrl : `${bUrl}/`;
        setBaseUrl(finalBaseUrl);
        fetchLayers(finalBaseUrl);
    }, [geoserverUrl, cleanupAllLayers]);

    const fetchLayers = async (bUrl: string) => {
        setLoading(true); setError(null); setLayers([]); setActiveLayers(new Set()); setConnectionStatus('connecting');
        try {
            let parsedLayers: WMSLayer[] = [];
            let requiresProxy = true;
            const wmsUrls = [`${bUrl}?service=WMS&version=1.3.0&request=GetCapabilities`, `${bUrl}?service=WMS&version=1.1.1&request=GetCapabilities`];
            for (const url of wmsUrls) {
                try {
                    let response = await fetch(url);
                    let text = await response.text();
                    if (!response.ok || !text.includes('WMS_Capabilities')) { requiresProxy = true; response = await proxyFetch(url); text = await response.text(); }
                    else requiresProxy = false;
                    if (text.includes('WMS_Capabilities') || text.includes('WMT_MS_Capabilities')) {
                        const parser = new DOMParser(); const xml = parser.parseFromString(text, 'text/xml');
                        if (!xml.querySelector('ServiceException')) { parsedLayers = parseWMSCapabilities(xml); if (parsedLayers.length > 0) break; }
                    }
                } catch (e) {
                    try {
                        requiresProxy = true; const response = await proxyFetch(url); const text = await response.text();
                        if (text.includes('WMS_Capabilities') || text.includes('WMT_MS_Capabilities')) {
                            const parser = new DOMParser(); const xml = parser.parseFromString(text, 'text/xml');
                            parsedLayers = parseWMSCapabilities(xml); if (parsedLayers.length > 0) break;
                        }
                    } catch (e2) { continue; }
                }
            }
            if (parsedLayers.length === 0) {
                const wfsUrls = [`${bUrl}?service=WFS&version=2.0.0&request=GetCapabilities`, `${bUrl}?service=WFS&version=1.1.0&request=GetCapabilities`];
                for (const url of wfsUrls) {
                    try {
                        requiresProxy = true; const response = await proxyFetch(url); const text = await response.text();
                        if (text.includes('WFS_Capabilities')) {
                            const parser = new DOMParser(); const xml = parser.parseFromString(text, 'text/xml');
                            parsedLayers = parseWFSCapabilities(xml); if (parsedLayers.length > 0) break;
                        }
                    } catch (e) { continue; }
                }
            }
            if (parsedLayers.length === 0) throw new Error('Nenhuma camada encontrada. Verifique a URL.');
            setNeedsProxy(requiresProxy); setLayers(parsedLayers); setConnectionStatus('connected');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao buscar camadas');
            setConnectionStatus('error');
        } finally { setLoading(false); }
    };

    const handleServerChange = (server: typeof SERVER_OPTIONS[0]) => {
        cleanupAllLayers(); setSelectedServer(server); setServerSearch(''); setShowDropdown(false); setShowTable(false);
        if (server.url) { setGeoserverUrl(server.url); setCustomUrl(''); } else setGeoserverUrl('');
    };

    const handleCustomUrlSubmit = () => {
        if (customUrl.trim()) { cleanupAllLayers(); setGeoserverUrl(customUrl.trim()); setServerSearch(''); setShowDropdown(false); }
    };

    const fitMapToBBox = (bbox: [number, number, number, number], options?: { maxZoom?: number }) => {
        if (!mapRef.current) return;
        const [minX, minY, maxX, maxY] = bbox;
        if (Math.abs(maxX - minX) < 1e-9 && Math.abs(maxY - minY) < 1e-9) {
            mapRef.current.easeTo({ center: [minX, minY], zoom: options?.maxZoom ?? 14, duration: 800 }); return;
        }
        mapRef.current.fitBounds([[minX, minY], [maxX, maxY]], { padding: 60, duration: 900, maxZoom: options?.maxZoom ?? 14 });
    };

    const getLayerBBoxFromServer = async (layerName: string): Promise<{ bbox: [number, number, number, number] | null; tier: string }> => {
        try {
            const url = `${baseUrl}?service=WFS&version=2.0.0&request=GetCapabilities`;
            const res = needsProxy ? await proxyFetch(url) : await fetch(url);
            if (res.ok) {
                const text = await res.text(); const parser = new DOMParser(); const xml = parser.parseFromString(text, 'text/xml');
                const bbox = extractBBoxFromCapabilities(xml, layerName); if (bbox) return { bbox, tier: 'wfs2-capabilities' };
            }
        } catch (e) { }
        try {
            const url = `${baseUrl}?service=WFS&version=1.1.0&request=GetCapabilities`;
            const res = needsProxy ? await proxyFetch(url) : await fetch(url);
            if (res.ok) {
                const text = await res.text(); const parser = new DOMParser(); const xml = parser.parseFromString(text, 'text/xml');
                const bbox = extractBBoxFromCapabilities(xml, layerName); if (bbox) return { bbox, tier: 'wfs1-capabilities' };
            }
        } catch (e) { }
        try {
            const url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${encodeURIComponent(layerName)}&outputFormat=application/json&srsName=EPSG:4674&count=50`;
            const res = needsProxy ? await proxyFetch(url) : await fetch(url);
            if (res.ok) {
                const json = await res.json(); if (json.features && json.features.length > 0) {
                    const bbox = bboxFromFeatures(json.features); if (bbox) return { bbox, tier: 'wfs2-sample50' };
                }
            }
        } catch (e) { }
        try {
            const url = `${baseUrl}?service=WFS&version=1.1.0&request=GetFeature&typeName=${encodeURIComponent(layerName)}&outputFormat=application/json&srsName=EPSG:4674&maxFeatures=50`;
            const res = needsProxy ? await proxyFetch(url) : await fetch(url);
            if (res.ok) {
                const json = await res.json(); if (json.features && json.features.length > 0) {
                    const bbox = bboxFromFeatures(json.features); if (bbox) return { bbox, tier: 'wfs1-sample50' };
                }
            }
        } catch (e) { }
        return { bbox: null, tier: 'none' };
    };

    const zoomToLayer = async (layerName: string) => {
        const { bbox } = await getLayerBBoxFromServer(layerName);
        if (bbox) fitMapToBBox(bbox);
    };

    const zoomToAllActiveLayers = async () => {
        if (activeLayersList.length === 0) return;
        const results = await Promise.all(activeLayersList.map(l => getLayerBBoxFromServer(l.name)));
        const merged = mergeBBoxes(results.map(r => r.bbox));
        if (merged) fitMapToBBox(merged);
    };

    const zoomToFeatures = (features: any[]) => { const bbox = bboxFromFeatures(features); if (bbox) fitMapToBBox(bbox); };

    const switchBasemap = (type: 'light' | 'dark' | 'satellite') => {
        if (!mapRef.current) return;
        const map = mapRef.current;
        const styleLayers = map.getStyle()?.layers || [];
        styleLayers.forEach((l: any) => { if (l && BASEMAP_LAYER_IDS.has(l.id)) { try { map.removeLayer(l.id); } catch (e) { } } });
        BASEMAP_SOURCE_IDS.forEach(id => { if (map.getSource(id)) { try { map.removeSource(id); } catch (e) { } } });

        const styles: Record<string, any> = { light: LIGHT_STYLE, dark: DARK_STYLE, satellite: SATELLITE_STYLE };
        const style = styles[type]; const sourceKey = Object.keys(style.sources)[0] as string;
        const sourceDef = style.sources[sourceKey]; const layerDef = style.layers[0];
        try {
            map.addSource(sourceKey, sourceDef);
            const currentLayers = map.getStyle()?.layers || []; const firstLayerId = currentLayers[0]?.id;
            if (firstLayerId) map.addLayer(layerDef, firstLayerId); else map.addLayer(layerDef);
        } catch (e) { }
        setActiveBasemap(type);
        setTimeout(() => { applyTerraDrawPaint(); bringDrawLayersToFront(); }, 50);
        setTimeout(() => { applyTerraDrawPaint(); bringDrawLayersToFront(); }, 200);
    };

    const toggleLayer = (layerName: string) => {
        if (!mapRef.current || !isReady) return;
        const newSet = new Set(activeLayers);
        if (newSet.has(layerName)) {
            newSet.delete(layerName);
            if (mapRef.current.getLayer(layerName)) mapRef.current.removeLayer(layerName);
            if (mapRef.current.getSource(layerName)) mapRef.current.removeSource(layerName);
            currentServerLayersRef.current.delete(layerName);
            if (selectedLayerForTable === layerName) { setShowTable(false); setSelectedLayerForTable(null); }
        } else {
            newSet.add(layerName);
            if (!mapRef.current.getSource(layerName)) {
                const wmsUrl = `${baseUrl}?service=WMS&version=1.3.0&request=GetMap&layers=${layerName}&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}`;
                const tileUrl = needsProxy ? `${CORS_PROXY}${encodeURIComponent(wmsUrl)}` : wmsUrl;
                mapRef.current.addSource(layerName, { type: 'raster', tiles: [tileUrl], tileSize: 256 });
                mapRef.current.addLayer({ id: layerName, type: 'raster', source: layerName, paint: { 'raster-opacity': 0.7 } });
                currentServerLayersRef.current.add(layerName);
                setTimeout(() => { applyTerraDrawPaint(); bringDrawLayersToFront(); }, 50);
                setTimeout(() => { applyTerraDrawPaint(); bringDrawLayersToFront(); }, 200);
                zoomToLayer(layerName);
            }
        }
        setActiveLayers(newSet);
    };

    const removeAllLayers = () => {
        if (!mapRef.current) return;
        activeLayers.forEach(layerName => {
            if (mapRef.current?.getLayer(layerName)) mapRef.current.removeLayer(layerName);
            if (mapRef.current?.getSource(layerName)) mapRef.current.removeSource(layerName);
            currentServerLayersRef.current.delete(layerName);
        });
        setActiveLayers(new Set()); setShowTable(false);
        setTimeout(() => { applyTerraDrawPaint(); bringDrawLayersToFront(); }, 50);
    };

    const openAttributeTable = async (layerName: string) => {
        setSelectedLayerForTable(layerName); setShowTable(true); setLoadingTable(true);
        setTableError(null); setTableData([]); setTableColumns([]); setCurrentPage(0);
        try {
            const url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&srsName=EPSG:4674&count=1000000`;
            const response = needsProxy ? await proxyFetch(url) : await fetch(url);
            if (!response.ok) throw new Error(`Requisição WFS falhou com status ${response.status}`);
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                let features: any[] = data.features;
                if (spatialFilter && spatialFilter.type === 'Polygon') features = clipFeaturesToPolygon(data.features, spatialFilter as GeoJSON.Polygon);
                if (features.length > 0) {
                    const props = features.map((feature: any) => feature.properties);
                    setTableData(props); setTableColumns(Object.keys(props[0])); zoomToFeatures(features);
                } else setTableError('Nenhuma feição encontrada na área selecionada');
            } else setTableError('Nenhuma feição encontrada para esta camada');
        } catch (err) {
            setTableError(err instanceof Error ? err.message : 'Falha ao buscar dados da camada');
        } finally { setLoadingTable(false); }
    };

    const fetchFilteredData = async (layerName: string, geometry?: GeoJSON.Geometry) => {
        setLoadingTable(true); setTableError(null); setTableData([]); setTableColumns([]); setCurrentPage(0);
        try {
            const url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&srsName=EPSG:4674&count=1000000`;
            const response = needsProxy ? await proxyFetch(url) : await fetch(url);
            if (!response.ok) throw new Error(`Requisição WFS falhou com status ${response.status}`);
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                let features: any[] = data.features;
                if (geometry && geometry.type === 'Polygon') features = clipFeaturesToPolygon(data.features, geometry as GeoJSON.Polygon);
                if (features.length > 0) {
                    const props = features.map((feature: any) => feature.properties);
                    setTableData(props); setTableColumns(Object.keys(props[0])); zoomToFeatures(features);
                } else setTableError('Nenhuma feição encontrada na área selecionada');
            } else setTableError('Nenhuma feição encontrada para esta camada');
        } catch (err) {
            setTableError(err instanceof Error ? err.message : 'Falha ao buscar dados');
        } finally { setLoadingTable(false); }
    };

    const downloadLayerByDraw = async (layerName: string, format: 'geojson' | 'shapefile' | 'csv' | 'kml') => {
        if (!spatialFilter || spatialFilter.type !== 'Polygon') { alert('Por favor, desenhe uma área no mapa primeiro!'); return; }
        setDownloadingLayer(layerName);
        try {
            const fullDataUrl = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&srsName=EPSG:4674&count=1000000`;
            const response = needsProxy ? await proxyFetch(fullDataUrl) : await fetch(fullDataUrl);
            if (!response.ok) throw new Error(`Falha ao baixar dados: ${response.status}`);
            const data = await response.json();
            if (!data.features || data.features.length === 0) { alert('Nenhuma feição encontrada nesta camada'); return; }
            const clippedFeatures = clipFeaturesToPolygon(data.features, spatialFilter as GeoJSON.Polygon);
            if (clippedFeatures.length === 0) { alert('Nenhuma feição encontrada na área selecionada'); return; }

            let blob: Blob; let fileExtension: string;
            if (format === 'geojson') {
                blob = new Blob([JSON.stringify({ type: 'FeatureCollection', features: clippedFeatures })], { type: 'application/json' }); fileExtension = 'geojson';
            } else if (format === 'shapefile') {
                blob = await buildShapefileZip(clippedFeatures, layerName); fileExtension = 'zip';
            } else if (format === 'csv') {
                blob = new Blob([convertToCSV(clippedFeatures)], { type: 'text/csv' }); fileExtension = 'csv';
            } else if (format === 'kml') {
                blob = new Blob([buildKml(clippedFeatures, layerName)], { type: 'application/vnd.google-earth.kml+xml' }); fileExtension = 'kml';
            } else throw new Error('Formato não suportado');

            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a'); link.href = downloadUrl;
            link.download = `${layerName}_area_selecionada.${fileExtension}`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            alert(`Falha ao baixar ${layerName}. Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        } finally { setDownloadingLayer(null); }
    };

    const downloadLayer = async (layerName: string, format: 'geojson' | 'shapefile' | 'csv' | 'kml') => {
        setDownloadingLayer(layerName);
        try {
            let blob: Blob; let fileExtension: string;
            if (format === 'shapefile') {
                const url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&srsName=EPSG:4674&count=1000000`;
                const response = needsProxy ? await proxyFetch(url) : await fetch(url);
                if (!response.ok) throw new Error(`Falha no download com status ${response.status}`);
                const data = await response.json();
                if (!data.features || data.features.length === 0) { alert('Nenhuma feição encontrada nesta camada'); return; }
                blob = await buildShapefileZip(data.features, layerName); fileExtension = 'zip';
            } else {
                let url = '';
                switch (format) {
                    case 'geojson': url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&srsName=EPSG:4674&count=1000000`; fileExtension = 'geojson'; break;
                    case 'csv': url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=csv&srsName=EPSG:4674&count=1000000`; fileExtension = 'csv'; break;
                    case 'kml': url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/vnd.google-earth.kml+xml&srsName=EPSG:4674&count=1000000`; fileExtension = 'kml'; break;
                    default: throw new Error('Formato não suportado');
                }
                const response = needsProxy ? await proxyFetch(url) : await fetch(url);
                if (!response.ok) throw new Error(`Falha no download com status ${response.status}`);
                blob = await response.blob();
            }
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a'); link.href = downloadUrl;
            link.download = `${layerName}.${fileExtension}`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            alert(`Falha ao baixar ${layerName}.`);
        } finally { setDownloadingLayer(null); }
    };

    const handleRowsPerPageChange = (newRowsPerPage: number) => {
        const firstRowIndex = currentPage * rowsPerPage;
        const newPage = Math.floor(firstRowIndex / newRowsPerPage);
        setRowsPerPage(newRowsPerPage); setCurrentPage(newPage);
    };

    const totalPages = Math.ceil(tableData.length / rowsPerPage);
    const paginatedData = tableData.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

    const handleDrawingToggle = () => {
        if (!drawRef.current) {
            alert('Erro: ferramenta de desenho não inicializada. Verifique o console (F12).');
            return;
        }
        if (drawingEnabled) {
            try { drawRef.current.clear(); } catch (e) { }
            try { drawRef.current.setMode('select'); } catch (e) { }
            setDrawingEnabled(false); setSpatialFilter(null);
        } else {
            if (spatialFilter) { try { drawRef.current.clear(); } catch (e) { } setSpatialFilter(null); }
            try { drawRef.current.setMode('polygon'); } catch (e) { }
            setDrawingEnabled(true);
        }
        setTimeout(() => { applyTerraDrawPaint(); bringDrawLayersToFront(); }, 50);
        setTimeout(() => { applyTerraDrawPaint(); bringDrawLayersToFront(); }, 200);
    };

    const downloadOverlay = downloadingLayer ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, borderRadius: 8, gap: 10, pointerEvents: 'auto', cursor: 'wait' }}>
            <div style={{ width: 28, height: 28, border: '3px solid #F0F0F0', borderTop: '3px solid #1976D2', borderRadius: '50%' }} />
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1976D2', letterSpacing: '-0.2px' }}>Download em progresso...</div>
        </div>
    ) : null;

    return (
        <div style={{ position: 'relative', height: '100vh', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', backgroundColor: '#F7F7F7' }}>
            <div style={{ height: '100vh' }} ref={mapContainerRef} />

            <button onClick={() => { if (mapRef.current) mapRef.current.fitBounds([[-73.99, -33.75], [-28.84, 5.27]], { padding: 40, duration: 1000 }); }} title="Zoom para o Brasil" style={{ position: 'absolute', top: 10, left: 370, zIndex: 1000, padding: '8px 14px', backgroundColor: 'white', color: '#3B3B3B', border: '1px solid #E0E0E0', borderRadius: 6, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                🇧🇷 Brasil
            </button>

            <ServerPanel
                showServerPanel={showServerPanel} setShowServerPanel={setShowServerPanel}
                serverPanelCollapsed={serverPanelCollapsed} setServerPanelCollapsed={setServerPanelCollapsed}
                selectedServer={selectedServer} handleServerChange={handleServerChange}
                serverSearch={serverSearch} setServerSearch={setServerSearch}
                showDropdown={showDropdown} setShowDropdown={setShowDropdown}
                filteredServers={filteredServers} customUrl={customUrl} setCustomUrl={setCustomUrl}
                handleCustomUrlSubmit={handleCustomUrlSubmit} geoserverUrl={geoserverUrl}
                connectionStatus={connectionStatus} needsProxy={needsProxy}
                switchBasemap={switchBasemap} activeBasemap={activeBasemap}
                isReady={isReady} activeLayers={activeLayers} baseUrl={baseUrl} layers={layers}
            />

            <LayersPanel
                isReady={isReady} geoserverUrl={geoserverUrl} layers={layers}
                activeLayers={activeLayers} activeTab={activeTab} setActiveTab={setActiveTab}
                layersPanelCollapsed={layersPanelCollapsed} setLayersPanelCollapsed={setLayersPanelCollapsed}
                spatialFilter={spatialFilter} drawingEnabled={drawingEnabled}
                handleDrawingToggle={handleDrawingToggle} downloadLayerByDraw={downloadLayerByDraw}
                downloadingLayer={downloadingLayer} removeAllLayers={removeAllLayers}
                zoomToAllActiveLayers={zoomToAllActiveLayers} layerSearch={layerSearch}
                setLayerSearch={setLayerSearch} loading={loading} error={error}
                fetchLayers={fetchLayers} baseUrl={baseUrl} filteredLayers={filteredLayers}
                toggleLayer={toggleLayer} openAttributeTable={openAttributeTable}
                downloadLayer={downloadLayer} filteredActiveLayers={filteredActiveLayers}
                zoomToLayer={zoomToLayer} activeLayersList={activeLayersList}
                setSpatialFilter={setSpatialFilter} setDrawingEnabled={setDrawingEnabled}
                drawRef={drawRef} bringDrawLayersToFront={bringDrawLayersToFront}
            />

            <AttributeTable
                showTable={showTable} selectedLayerForTable={selectedLayerForTable}
                setShowTable={setShowTable} setSelectedLayerForTable={setSelectedLayerForTable}
                tableHeight={tableHeight} handleDragStart={handleDragStart}
                tableData={tableData} totalPages={totalPages} currentPage={currentPage}
                setCurrentPage={setCurrentPage} rowsPerPage={rowsPerPage}
                handleRowsPerPageChange={handleRowsPerPageChange} loadingTable={loadingTable}
                tableError={tableError} tableColumns={tableColumns} paginatedData={paginatedData}
                spatialFilter={spatialFilter} layers={layers}
            />

            {downloadOverlay}
        </div>
    );
};

export default MapViwer;