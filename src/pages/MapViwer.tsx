// BaseMap.tsx
import mapboxgl from "mapbox-gl"
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { intersect } from '@turf/intersect';
import { featureCollection } from '@turf/helpers';
import booleanIntersects from '@turf/boolean-intersects';
import lineIntersect from '@turf/line-intersect';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import midpoint from '@turf/midpoint';

interface WMSLayer {
    name: string;
    title: string;
    abstract?: string;
}

interface FeatureProperties {
    [key: string]: any;
}

type BBox = [number, number, number, number];

const CORS_PROXY = 'https://corsproxy.io/?';

// --- ORGANIZED SERVER LIST ---
const SERVER_OPTIONS = [
    { label: 'ANP - Agência Nacional do Petróleo, Gás Natural e Biocombustíveis', url: 'https://gishub.anp.gov.br/geoserver/ows' },
    { label: 'ANTT - Agência Nacional de Transportes Terrestres', url: 'https://geoservicos.inde.gov.br/geoserver/ANTT/ows' },
    { label: 'BNDES - Banco Nacional de Desenvolvimento Econômico e Social', url: 'https://geoservicos.inde.gov.br/geoserver/BNDES/ows' },
    { label: 'Censipam - Centro Gestor e Operacional do Sistema de Proteção da Amazônia', url: 'https://panorama.sipam.gov.br/geoserver/publico/ows' },
    { label: 'CPRM / SGB - Serviço Geológico do Brasil', url: 'https://geoservicos.sgb.gov.br/geoserver/geologia/ows' },
    { label: 'DataGeo - São Paulo', url: 'https://datageo.ambiente.sp.gov.br/geoserver/ows' },
    { label: 'DNIT - Departamento Nacional de Infraestrutura de Transportes', url: 'https://geoservicos.inde.gov.br/geoserver/DNIT/ows' },
    { label: 'EPE - Empresa de Pesquisa Energética', url: 'https://geoservicos.inde.gov.br/geoserver/EPE/ows' },
    { label: 'FUNAI - Fundação Nacional dos Povos Indígenas', url: 'https://geoserver.funai.gov.br/geoserver/ows' },
    { label: 'FUNAI/CMR - Centro de Monitoramento e Resolução de Conflitos Fundiários', url: 'https://cmr.funai.gov.br/geoserver/ows' },
    { label: 'IBGE - CENSO 2022 - Instituto Brasileiro de Geografia e Estatística', url: 'https://geoservicoscenso2022.ibge.gov.br/geoserver/censo2022/ows' },
    { label: 'IBGE - Malhas Territoriais - Instituto Brasileiro de Geografia e Estatística', url: 'https://geoservicos.ibge.gov.br/geoserver/ows' },
    { label: 'IBGE - ODS - Instituto Brasileiro de Geografia e Estatística', url: 'https://geoservicos.ibge.gov.br/geoserver/ODS/ows' },
    { label: 'ICMBIO - Instituto Chico Mendes de Conservação da Biodiversidade', url: 'https://geoservicos.inde.gov.br/geoserver/ICMBio/ows' },
    { label: 'IDE SISEMA - Infraestrutura de Dados Espaciais do Sistema Estadual de Meio Ambiente de Minas Gerais', url: 'https://geoserver.meioambiente.mg.gov.br/ows' },
    { label: 'INDE Catalog - Infraestrutura Nacional de Dados Espaciais', url: 'https://geoservicos.inde.gov.br/geoserver/wfs' },
    { label: 'INEA - Instituto Estadual do Ambiente do Rio de Janeiro', url: 'https://geoservicos.inde.gov.br/geoserver/INEA/ows' },
    { label: 'INPE - Instituto Nacional de Pesquisas Espaciais', url: 'https://terrabrasilis.dpi.inpe.br/geoserver/ows' },
    { label: 'IPHAN - Instituto do Patrimônio Histórico e Artístico Nacional', url: 'https://geoserver.iphan.gov.br/geoserver/ows' },
    { label: 'MB/COMPAAz - Marinha do Brasil / Comissão de Planejamento Ambiental da Amazônia', url: 'https://geoservicos.inde.gov.br/geoserver/COMPAAz/ows' },
    { label: 'MB/DPC - Marinha do Brasil / Diretoria de Portos e Costas', url: 'https://geoservicos.inde.gov.br/geoserver/DPC/ows' },
    { label: 'MB/DPHDM - Marinha do Brasil / Diretoria de Hidrografia e Navegação', url: 'https://geoservicos.inde.gov.br/geoserver/DPHDM/ows' },
    { label: 'MDIC - Ministério do Desenvolvimento, Indústria, Comércio e Serviços', url: 'https://geoservicos.inde.gov.br/geoserver/MDIC/ows' },
    { label: 'MMA - Ministério do Meio Ambiente e Mudança do Clima', url: 'https://geoservicos.inde.gov.br/geoserver/MMA/ows' },
    { label: 'MPA - Ministério da Pesca e Aquicultura', url: 'https://geoservicos.inde.gov.br/geoserver/MPA/ows' },
    { label: 'MPO - Ministério do Planejamento e Orçamento', url: 'https://geoservicos.inde.gov.br/geoserver/MPOG/ows' },
    { label: 'MTR - Ministério dos Transportes', url: 'https://geoservicos.inde.gov.br/geoserver/MInfra/ows' },
    { label: 'MTUR - Ministério do Turismo', url: 'https://geoservicos.inde.gov.br/geoserver/MTU/ows' },
    { label: 'PGGM - Presidência da República / Gabinete de Gestão Integrada', url: 'https://geoservicos.inde.gov.br/geoserver/PGGM/ows' },
    { label: 'Prefeitura BH (MG) - BH Map', url: 'https://bhmap.pbh.gov.br/v2/api/idebhgeo/wms' },
    { label: 'PRODEMG (MG) - Companhia de Tecnologia da Informação do Estado de Minas Gerais', url: 'http://geoserver.prodemge.gov.br/geoserver/ows' },
    { label: 'SEPLAN (TO) - Secretaria do Planejamento e Orçamento do Tocantins', url: 'https://geoportal.to.gov.br/geoserver/ows' },
    { label: 'SPU - Secretaria de Patrimônio da União', url: 'https://geoservicos.inde.gov.br/geoserver/SPU/ows' },
    { label: 'UFABC - Universidade Federal do ABC', url: 'https://geoservicos.inde.gov.br/geoserver/UFABC/ows' },
    { label: 'VALEC - Engenharia, Construções e Ferrovias S.A.', url: 'https://geoservicos.inde.gov.br/geoserver/VALEC/ows' },
    { label: 'Personalizado', url: '' },
];

// --- LEGEND BOX COMPONENT ---
interface LegendBoxProps {
    activeLayers: Set<string>;
    baseUrl: string;
    needsProxy: boolean;
    layers: WMSLayer[];
}

const LegendBox = ({ activeLayers, baseUrl, needsProxy, layers }: LegendBoxProps) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [legendUrls, setLegendUrls] = useState<Map<string, string>>(new Map());
    const [zoomLevel, setZoomLevel] = useState(1);

    const activeLayerNames = useMemo(() => {
        return Array.from(activeLayers).filter(name => layers.some(l => l.name === name));
    }, [activeLayers, layers]);

    useEffect(() => {
        if (!baseUrl || activeLayerNames.length === 0) {
            setLegendUrls(new Map());
            return;
        }

        const newUrls = new Map<string, string>();
        activeLayerNames.forEach(layerName => {
            let legendUrl = `${baseUrl}?service=WMS&version=1.3.0&request=GetLegendGraphic&layer=${layerName}&format=image/png&width=50&height=50&legend_options=fontSize:12;fontColor:0x000000;`;
            if (needsProxy) {
                legendUrl = `${CORS_PROXY}${encodeURIComponent(legendUrl)}`;
            }
            newUrls.set(layerName, legendUrl);
        });

        setLegendUrls(newUrls);
    }, [baseUrl, needsProxy, activeLayerNames]);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));

    if (activeLayerNames.length === 0) return null;

    return (
        <div style={{
            width: '100%',
            backgroundColor: 'white',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isExpanded ? '10px' : '0',
                borderBottom: isExpanded ? '1px solid #F0F0F0' : 'none',
                paddingBottom: isExpanded ? '10px' : '0'
            }}>
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{ fontWeight: 'bold', fontSize: 16, color: '#3B3B3B', cursor: 'pointer', letterSpacing: '-0.3px' }}
                >
                    Legenda
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isExpanded && (
                        <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                                onClick={handleZoomIn}
                                title="Controlar tamanho do rótulo"
                                style={{ border: '1px solid #E0E0E0', background: '#FFFFFF', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', lineHeight: '18px', color: '#3B3B3B' }}
                            >+</button>
                            <button
                                onClick={handleZoomOut}
                                title="Controlar tamanho do rótulo"
                                style={{ border: '1px solid #E0E0E0', background: '#FFFFFF', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', lineHeight: '18px', color: '#3B3B3B' }}
                            >-</button>
                        </div>
                    )}

                    <span
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{ fontSize: 16, cursor: 'pointer', padding: '0 5px', color: '#3B3B3B' }}
                    >
                        {isExpanded ? '▲' : '▼'}
                    </span>
                </div>
            </div>

            {isExpanded && (
                <div style={{
                    overflowY: 'auto',
                    overflowX: 'auto',
                    padding: '0 5px 5px 0',
                    maxHeight: 'calc(100vh - 450px)'
                }}>
                    {activeLayerNames.map((layerName) => {
                        const layerInfo = layers.find(l => l.name === layerName);
                        const imgSrc = legendUrls.get(layerName);
                        return (
                            <div key={layerName} style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #F0F0F0' }}>
                                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: '8px', color: '#3B3B3B' }}>
                                    {layerInfo?.title || layerName}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    {imgSrc && (
                                        <img
                                            src={imgSrc}
                                            alt={`Legenda para ${layerName}`}
                                            style={{
                                                minWidth: '100%',
                                                width: 'auto',
                                                maxWidth: 'none',
                                                height: 'auto',
                                                objectFit: 'contain',
                                                transform: `scale(${zoomLevel})`,
                                                transformOrigin: 'top left',
                                                marginBottom: `-${(zoomLevel - 1) * 50}px`
                                            }}
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- MAIN BASEMAP COMPONENT ---
const BaseMap = () => {
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const drawRef = useRef<MapboxDraw | null>(null);

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
    const tableRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const dragStartYRef = useRef(0);
    const startHeightRef = useRef(0);

    const currentServerLayersRef = useRef<Set<string>>(new Set());

    const [drawingEnabled, setDrawingEnabled] = useState(false);
    const [spatialFilter, setSpatialFilter] = useState<GeoJSON.Geometry | null>(null);

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

    const proxyFetch = async (url: string): Promise<Response> => {
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy retornou ${response.status}`);
        return response;
    };

    const cleanupAllLayers = useCallback(() => {
        if (!mapRef.current) return;

        currentServerLayersRef.current.forEach(layerName => {
            try {
                if (mapRef.current?.getLayer(layerName)) {
                    mapRef.current.removeLayer(layerName);
                }
                if (mapRef.current?.getSource(layerName)) {
                    mapRef.current.removeSource(layerName);
                }
            } catch (e) {
                console.warn(`Erro ao remover camada ${layerName}:`, e);
            }
        });

        currentServerLayersRef.current.clear();

        if (drawRef.current) {
            drawRef.current.deleteAll();
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
            if (selectedLayerForTable) {
                fetchFilteredData(selectedLayerForTable, feature.geometry);
            }
        }
    }, [selectedLayerForTable]);

    const handleDrawUpdate = useCallback((e: { features: GeoJSON.Feature[] }) => {
        const feature = e.features[0];
        if (feature.geometry.type === 'Polygon') {
            setSpatialFilter(feature.geometry);
            if (selectedLayerForTable) {
                fetchFilteredData(selectedLayerForTable, feature.geometry);
            }
        }
    }, [selectedLayerForTable]);

    const handleDrawDelete = useCallback(() => {
        setSpatialFilter(null);
        setDrawingEnabled(false);
        if (selectedLayerForTable) {
            openAttributeTable(selectedLayerForTable);
        }
    }, [selectedLayerForTable]);

    const bringDrawLayersToFront = useCallback(() => {
        if (!mapRef.current) return;

        const drawLayerIds = [
            'gl-draw-polygon-fill',
            'gl-draw-polygon-stroke',
            'gl-draw-polygon-midpoint',
            'gl-draw-polygon-vertex',
            'gl-draw-line',
            'gl-draw-point',
            'gl-draw-polygon',
            'gl-draw-polygon-fill-active',
            'gl-draw-polygon-stroke-active'
        ];

        drawLayerIds.forEach(layerId => {
            if (mapRef.current?.getLayer(layerId)) {
                mapRef.current.moveLayer(layerId);
            }
        });

        const allLayers = mapRef.current.getStyle().layers || [];
        allLayers.forEach(layer => {
            if (layer.id.includes('gl-draw') && !drawLayerIds.includes(layer.id)) {
                if (mapRef.current?.getLayer(layer.id)) {
                    mapRef.current.moveLayer(layer.id);
                }
            }
        });
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const theBaseMap = new mapboxgl.Map({
            container: mapContainerRef.current,
            center: [-46.93820917792772, -19.584011291377593],
            zoom: 5,
            style: 'mapbox://styles/mapbox/light-v11',
            accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
            projection: 'mercator'
        });

        mapRef.current = theBaseMap;

        theBaseMap.on("load", () => {
            setIsReady(true);

            const draw = new MapboxDraw({
                displayControlsDefault: false,
                controls: {
                    polygon: false,
                    trash: false
                }
            });

            theBaseMap.addControl(draw);
            drawRef.current = draw;

            theBaseMap.on('draw.create', handleDrawCreate);
            theBaseMap.on('draw.delete', handleDrawDelete);
            theBaseMap.on('draw.update', handleDrawUpdate);

            setTimeout(() => bringDrawLayersToFront(), 200);
        });

        return () => {
            if (drawRef.current) {
                theBaseMap.removeControl(drawRef.current);
            }
            theBaseMap.remove();
            mapRef.current = null;
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
        };
    }, []);

    useEffect(() => {
        if (!geoserverUrl) return;

        cleanupAllLayers();
        setLayers([]);
        setActiveLayers(new Set());
        setLayerSearch('');
        setActiveTab('all');
        setShowTable(false);

        const bUrl = geoserverUrl.includes('?')
            ? geoserverUrl.substring(0, geoserverUrl.indexOf('?'))
            : geoserverUrl;

        const finalBaseUrl = bUrl.endsWith('/') ? bUrl : `${bUrl}/`;
        setBaseUrl(finalBaseUrl);

        fetchLayers(finalBaseUrl);
    }, [geoserverUrl, cleanupAllLayers]);

    const parseWMSCapabilities = (xml: Document): WMSLayer[] => {
        const layersMap = new Map<string, WMSLayer>();
        const layerElements = xml.querySelectorAll('Layer > Layer');

        layerElements.forEach((layerEl) => {
            const name = layerEl.querySelector('Name')?.textContent;
            const title = layerEl.querySelector('Title')?.textContent;
            if (name && title) {
                if (!layersMap.has(name)) {
                    layersMap.set(name, {
                        name,
                        title,
                        abstract: layerEl.querySelector('Abstract')?.textContent || undefined,
                    });
                }
            }
        });

        if (layersMap.size === 0) {
            const allLayers = xml.querySelectorAll('Layer');
            allLayers.forEach((layerEl) => {
                const name = layerEl.querySelector('Name')?.textContent;
                const title = layerEl.querySelector('Title')?.textContent;
                if (name && title && !layersMap.has(name)) {
                    layersMap.set(name, {
                        name,
                        title,
                        abstract: layerEl.querySelector('Abstract')?.textContent || undefined,
                    });
                }
            });
        }

        return Array.from(layersMap.values());
    };

    const parseWFSCapabilities = (xml: Document): WMSLayer[] => {
        const layersMap = new Map<string, WMSLayer>();
        const featureTypes = xml.querySelectorAll('FeatureType');

        featureTypes.forEach((ft) => {
            const name = ft.querySelector('Name')?.textContent;
            const title = ft.querySelector('Title')?.textContent;
            if (name && title && !layersMap.has(name)) {
                layersMap.set(name, { name, title });
            }
        });

        return Array.from(layersMap.values());
    };

    const fetchLayers = async (bUrl: string) => {
        setLoading(true);
        setError(null);
        setLayers([]);
        setActiveLayers(new Set());
        setConnectionStatus('connecting');

        try {
            let parsedLayers: WMSLayer[] = [];
            let requiresProxy = true;

            const wmsUrls = [
                `${bUrl}?service=WMS&version=1.3.0&request=GetCapabilities`,
                `${bUrl}?service=WMS&version=1.1.1&request=GetCapabilities`,
            ];

            for (const url of wmsUrls) {
                try {
                    let response = await fetch(url);
                    let text = await response.text();

                    if (!response.ok || !text.includes('WMS_Capabilities')) {
                        requiresProxy = true;
                        response = await proxyFetch(url);
                        text = await response.text();
                    } else {
                        requiresProxy = false;
                    }

                    if (text.includes('WMS_Capabilities') || text.includes('WMT_MS_Capabilities')) {
                        const parser = new DOMParser();
                        const xml = parser.parseFromString(text, 'text/xml');
                        const exception = xml.querySelector('ServiceException');
                        if (!exception) {
                            parsedLayers = parseWMSCapabilities(xml);
                            if (parsedLayers.length > 0) break;
                        }
                    }
                } catch (e) {
                    try {
                        requiresProxy = true;
                        const response = await proxyFetch(url);
                        const text = await response.text();

                        if (text.includes('WMS_Capabilities') || text.includes('WMT_MS_Capabilities')) {
                            const parser = new DOMParser();
                            const xml = parser.parseFromString(text, 'text/xml');
                            parsedLayers = parseWMSCapabilities(xml);
                            if (parsedLayers.length > 0) break;
                        }
                    } catch (e2) {
                        continue;
                    }
                }
            }

            if (parsedLayers.length === 0) {
                const wfsUrls = [
                    `${bUrl}?service=WFS&version=2.0.0&request=GetCapabilities`,
                    `${bUrl}?service=WFS&version=1.1.0&request=GetCapabilities`,
                ];

                for (const url of wfsUrls) {
                    try {
                        requiresProxy = true;
                        const response = await proxyFetch(url);
                        const text = await response.text();

                        if (text.includes('WFS_Capabilities')) {
                            const parser = new DOMParser();
                            const xml = parser.parseFromString(text, 'text/xml');
                            parsedLayers = parseWFSCapabilities(xml);
                            if (parsedLayers.length > 0) break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }

            if (parsedLayers.length === 0) {
                throw new Error('Nenhuma camada encontrada. Verifique a URL.');
            }

            setNeedsProxy(requiresProxy);
            setLayers(parsedLayers);
            setConnectionStatus('connected');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao buscar camadas');
            setConnectionStatus('error');
            console.error('Erro ao buscar:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleServerChange = (server: typeof SERVER_OPTIONS[0]) => {
        cleanupAllLayers();
        setSelectedServer(server);
        setServerSearch('');
        setShowDropdown(false);
        setShowTable(false);

        if (server.url) {
            setGeoserverUrl(server.url);
            setCustomUrl('');
        } else {
            setGeoserverUrl('');
        }
    };

    const handleCustomUrlSubmit = () => {
        if (customUrl.trim()) {
            cleanupAllLayers();
            setGeoserverUrl(customUrl.trim());
            setServerSearch('');
            setShowDropdown(false);
        }
    };

    // --- BBOX / ZOOM HELPERS -------------------------------------------------
    const bboxFromFeatures = (features: any[]): BBox | null => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let found = false;

        const visitCoords = (coords: any) => {
            if (typeof coords[0] === 'number') {
                const [x, y] = coords;
                if (typeof x === 'number' && typeof y === 'number' && isFinite(x) && isFinite(y)) {
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                    found = true;
                }
            } else if (Array.isArray(coords)) {
                for (const c of coords) visitCoords(c);
            }
        };

        for (const f of features) {
            if (f && f.geometry && f.geometry.coordinates) {
                visitCoords(f.geometry.coordinates);
            }
        }

        if (!found) return null;
        return [minX, minY, maxX, maxY];
    };

    const mergeBBoxes = (boxes: (BBox | null)[]): BBox | null => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let found = false;
        for (const b of boxes) {
            if (!b) continue;
            const [a, c, d, e] = b;
            if (a < minX) minX = a;
            if (c < minY) minY = c;
            if (d > maxX) maxX = d;
            if (e > maxY) maxY = e;
            found = true;
        }
        return found ? [minX, minY, maxX, maxY] : null;
    };

    const fitMapToBBox = (
        bbox: BBox,
        options?: { maxZoom?: number }
    ) => {
        if (!mapRef.current) return;
        const [minX, minY, maxX, maxY] = bbox;

        if (Math.abs(maxX - minX) < 1e-9 && Math.abs(maxY - minY) < 1e-9) {
            mapRef.current.easeTo({
                center: [minX, minY],
                zoom: options?.maxZoom ?? 14,
                duration: 800
            });
            return;
        }

        mapRef.current.fitBounds(
            [[minX, minY], [maxX, maxY]],
            {
                padding: 60,
                duration: 900,
                maxZoom: options?.maxZoom ?? 14
            }
        );
    };

    const extractBBoxFromCapabilities = (xml: Document, layerName: string): BBox | null => {
        const featureTypes = Array.from(xml.querySelectorAll('FeatureType'));
        for (const ft of featureTypes) {
            const nameEl = ft.querySelector('Name')?.textContent?.trim() || '';
            if (nameEl !== layerName && !nameEl.endsWith(`:${layerName}`) && !layerName.endsWith(`:${nameEl}`)) {
                continue;
            }

            const llbb = ft.querySelector('LatLongBoundingBox');
            if (llbb) {
                const minx = parseFloat(llbb.getAttribute('minx') || '');
                const miny = parseFloat(llbb.getAttribute('miny') || '');
                const maxx = parseFloat(llbb.getAttribute('maxx') || '');
                const maxy = parseFloat(llbb.getAttribute('maxy') || '');
                if ([minx, miny, maxx, maxy].every(Number.isFinite)) {
                    return [minx, miny, maxx, maxy];
                }
            }

            const wgs = ft.querySelector('WGS84BoundingBox');
            if (wgs) {
                const lower = wgs.querySelector('LowerCorner')?.textContent?.trim().split(/\s+/).map(Number);
                const upper = wgs.querySelector('UpperCorner')?.textContent?.trim().split(/\s+/).map(Number);
                if (lower && upper && lower.length === 2 && upper.length === 2 &&
                    lower.every(Number.isFinite) && upper.every(Number.isFinite)) {
                    return [lower[0], lower[1], upper[0], upper[1]];
                }
            }
        }
        return null;
    };

    const getLayerBBoxFromServer = async (
        layerName: string
    ): Promise<{ bbox: BBox | null; tier: string }> => {
        try {
            const url = `${baseUrl}?service=WFS&version=2.0.0&request=GetCapabilities`;
            const res = needsProxy ? await proxyFetch(url) : await fetch(url);
            if (res.ok) {
                const text = await res.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, 'text/xml');
                const bbox = extractBBoxFromCapabilities(xml, layerName);
                if (bbox) return { bbox, tier: 'wfs2-capabilities' };
            }
        } catch (e) {
            console.warn(`[bbox] WFS 2.0.0 capabilities falhou para ${layerName}:`, e);
        }

        try {
            const url = `${baseUrl}?service=WFS&version=1.1.0&request=GetCapabilities`;
            const res = needsProxy ? await proxyFetch(url) : await fetch(url);
            if (res.ok) {
                const text = await res.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, 'text/xml');
                const bbox = extractBBoxFromCapabilities(xml, layerName);
                if (bbox) return { bbox, tier: 'wfs1-capabilities' };
            }
        } catch (e) {
            console.warn(`[bbox] WFS 1.1.0 capabilities falhou para ${layerName}:`, e);
        }

        try {
            const url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${encodeURIComponent(layerName)}&outputFormat=application/json&srsName=EPSG:4674&count=50`;
            const res = needsProxy ? await proxyFetch(url) : await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (json.features && json.features.length > 0) {
                    const bbox = bboxFromFeatures(json.features);
                    if (bbox) return { bbox, tier: 'wfs2-sample50' };
                }
            }
        } catch (e) {
            console.warn(`[bbox] WFS 2.0.0 count=50 falhou para ${layerName}:`, e);
        }

        try {
            const url = `${baseUrl}?service=WFS&version=1.1.0&request=GetFeature&typeName=${encodeURIComponent(layerName)}&outputFormat=application/json&srsName=EPSG:4674&maxFeatures=50`;
            const res = needsProxy ? await proxyFetch(url) : await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (json.features && json.features.length > 0) {
                    const bbox = bboxFromFeatures(json.features);
                    if (bbox) return { bbox, tier: 'wfs1-sample50' };
                }
            }
        } catch (e) {
            console.warn(`[bbox] WFS 1.1.0 maxFeatures=50 falhou para ${layerName}:`, e);
        }

        return { bbox: null, tier: 'none' };
    };

    const zoomToLayer = async (layerName: string) => {
        const { bbox, tier } = await getLayerBBoxFromServer(layerName);
        if (bbox) {
            console.log(`[zoom] ${layerName} -> tier=${tier} bbox=${JSON.stringify(bbox)}`);
            fitMapToBBox(bbox);
        } else {
            console.warn(`Não foi possível determinar a extensão da camada ${layerName} (todas as tentativas falharam)`);
        }
    };

    const zoomToAllActiveLayers = async () => {
        if (activeLayersList.length === 0) return;

        console.log(`[zoom] Calculando extensão combinada de ${activeLayersList.length} camadas...`);

        const results = await Promise.all(
            activeLayersList.map(l => getLayerBBoxFromServer(l.name))
        );

        const merged = mergeBBoxes(results.map(r => r.bbox));

        if (merged) {
            console.log(`[zoom] Extensão combinada: ${JSON.stringify(merged)}`);
            fitMapToBBox(merged);
        } else {
            console.warn('[zoom] Não foi possível determinar a extensão combinada.');
        }
    };

    const zoomToFeatures = (features: any[]) => {
        const bbox = bboxFromFeatures(features);
        if (bbox) fitMapToBBox(bbox);
    };
    // ------------------------------------------------------------------------

    const toggleLayer = (layerName: string) => {
        if (!mapRef.current || !isReady) return;

        const newSet = new Set(activeLayers);

        if (newSet.has(layerName)) {
            newSet.delete(layerName);
            if (mapRef.current.getLayer(layerName)) {
                mapRef.current.removeLayer(layerName);
            }
            if (mapRef.current.getSource(layerName)) {
                mapRef.current.removeSource(layerName);
            }
            currentServerLayersRef.current.delete(layerName);

            if (selectedLayerForTable === layerName) {
                setShowTable(false);
                setSelectedLayerForTable(null);
            }
        } else {
            newSet.add(layerName);
            if (!mapRef.current.getSource(layerName)) {
                const wmsUrl = `${baseUrl}?service=WMS&version=1.3.0&request=GetMap&layers=${layerName}&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}`;

                const tileUrl = needsProxy
                    ? `${CORS_PROXY}${encodeURIComponent(wmsUrl)}`
                    : wmsUrl;

                mapRef.current.addSource(layerName, {
                    type: 'raster',
                    tiles: [tileUrl],
                    tileSize: 256
                });

                mapRef.current.addLayer({
                    id: layerName,
                    type: 'raster',
                    source: layerName,
                    paint: {
                        'raster-opacity': 0.7
                    }
                });

                currentServerLayersRef.current.add(layerName);

                setTimeout(() => bringDrawLayersToFront(), 50);
                setTimeout(() => bringDrawLayersToFront(), 200);

                zoomToLayer(layerName);
            }
        }

        setActiveLayers(newSet);
    };

    const removeAllLayers = () => {
        if (!mapRef.current) return;

        const layersToRemove = new Set(activeLayers);
        layersToRemove.forEach(layerName => {
            if (mapRef.current?.getLayer(layerName)) {
                mapRef.current.removeLayer(layerName);
            }
            if (mapRef.current?.getSource(layerName)) {
                mapRef.current.removeSource(layerName);
            }
            currentServerLayersRef.current.delete(layerName);
        });

        setActiveLayers(new Set());
        setShowTable(false);

        setTimeout(() => bringDrawLayersToFront(), 50);
    };

    // --- CLIP HELPERS --------------------------------------------------------
    // Dispatch on geometry type:
    //   - Polygon / MultiPolygon -> Turf intersect (areal clip)
    //   - LineString / MultiLineString -> lineIntersect to find crossings,
    //     splice them into the coordinate array, then midpoint test per
    //     sub-segment. This produces true clipped lines with endpoints
    //     exactly on the polygon boundary.
    //   - Point / MultiPoint -> booleanPointInPolygon
    // Every surviving piece carries the parent feature's original properties.
    // ------------------------------------------------------------------------

    const asFeature = (geometry: any, properties: any, id?: any): any => ({
        type: 'Feature',
        ...(id !== undefined ? { id } : {}),
        properties: properties || {},
        geometry,
    });

    const clipPolygonFeature = (
        feat: any,
        polygonFeature: any
    ): GeoJSON.Feature[] => {
        let clipped: any = null;
        try {
            clipped = intersect(featureCollection([
                asFeature(feat.geometry, feat.properties, feat.id),
                polygonFeature,
            ]));
        } catch (e) {
            console.warn('Turf intersect falhou para uma feição polygon:', e);
            return [];
        }

        if (!clipped || !clipped.geometry) return [];

        return [asFeature(clipped.geometry, feat.properties, feat.id)];
    };

    // Return true if two coordinates are practically the same point.
    const samePoint = (a: number[], b: number[], eps = 1e-9) =>
        Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps;

    // Splice crossing points into a LineString's coordinate array at the
    // correct position along the line.
    const spliceCrossingsIntoLine = (
        coords: number[][],
        crossings: number[][]
    ): number[][] => {
        if (crossings.length === 0) return coords.slice();

        // Collect all coordinates to insert, along with their distance along
        // the line so we can sort them correctly.
        type Pt = { coord: number[]; dist: number };
        const points: Pt[] = [];

        // Precompute cumulative length per segment.
        const segStartDist: number[] = [0];
        for (let i = 1; i < coords.length; i++) {
            const dx = coords[i][0] - coords[i - 1][0];
            const dy = coords[i][1] - coords[i - 1][1];
            segStartDist.push(segStartDist[i - 1] + Math.sqrt(dx * dx + dy * dy));
        }
        const totalLen = segStartDist[segStartDist.length - 1];

        for (const c of crossings) {
            // Find which segment this crossing lies on by scanning.
            let bestSeg = -1;
            let bestDistAlongSeg = Infinity;
            let bestDistanceSq = Infinity;

            for (let i = 0; i < coords.length - 1; i++) {
                const a = coords[i];
                const b = coords[i + 1];
                // Distance from c to segment [a, b] in coordinate units.
                const vx = b[0] - a[0];
                const vy = b[1] - a[1];
                const wx = c[0] - a[0];
                const wy = c[1] - a[1];
                const segLenSq = vx * vx + vy * vy;
                let t = segLenSq === 0 ? 0 : (wx * vx + wy * vy) / segLenSq;
                if (t < 0) t = 0;
                if (t > 1) t = 1;
                const projX = a[0] + t * vx;
                const projY = a[1] + t * vy;
                const dxp = c[0] - projX;
                const dyp = c[1] - projY;
                const dSq = dxp * dxp + dyp * dyp;

                if (dSq < bestDistanceSq) {
                    bestDistanceSq = dSq;
                    bestSeg = i;
                    bestDistAlongSeg = t;
                }
            }

            if (bestSeg === -1) continue;

            // Distance along the whole line = start of segment + t * seg length.
            const segLen = Math.sqrt(
                Math.pow(coords[bestSeg + 1][0] - coords[bestSeg][0], 2) +
                Math.pow(coords[bestSeg + 1][1] - coords[bestSeg][1], 2)
            );
            const dist = segStartDist[bestSeg] + bestDistAlongSeg * segLen;
            points.push({ coord: [c[0], c[1]], dist: Math.min(dist, totalLen) });
        }

        // Merge: existing vertices (with their cumulative distances) plus
        // crossing points, sorted by distance, deduplicated.
        const merged: Pt[] = [];
        for (let i = 0; i < coords.length; i++) {
            merged.push({ coord: coords[i], dist: segStartDist[i] });
        }
        for (const p of points) merged.push(p);

        merged.sort((a, b) => a.dist - b.dist);

        const out: number[][] = [];
        for (const p of merged) {
            if (out.length === 0) {
                out.push(p.coord);
            } else if (!samePoint(out[out.length - 1], p.coord)) {
                out.push(p.coord);
            }
        }

        return out;
    };

    // Split the enriched coordinate array into sub-segments at every
    // crossing point. Returns an array of coordinate arrays, each of which
    // is a candidate LineString.
    const splitLineAtCrossings = (
        enriched: number[][],
        crossings: number[][]
    ): number[][][] => {
        if (crossings.length === 0) return [enriched];

        // Find the indices in the enriched array that correspond to crossings.
        const crossingIndices: number[] = [];
        for (let i = 0; i < enriched.length; i++) {
            for (const c of crossings) {
                if (samePoint(enriched[i], c, 1e-9)) {
                    crossingIndices.push(i);
                    break;
                }
            }
        }

        if (crossingIndices.length === 0) return [enriched];

        // Sort and dedupe indices.
        const uniqueIndices = Array.from(new Set(crossingIndices)).sort((a, b) => a - b);

        const pieces: number[][][] = [];
        let start = 0;
        for (const idx of uniqueIndices) {
            if (idx > start) {
                // piece from start to idx (inclusive) — endpoints touch crossings.
                pieces.push(enriched.slice(start, idx + 1));
            }
            start = idx;
        }
        // Final piece from the last crossing to the end.
        if (start < enriched.length - 1) {
            pieces.push(enriched.slice(start));
        }

        return pieces.filter(p => p.length >= 2);
    };

    // Clip a single LineString (coordinate array). Returns an array of
    // surviving coordinate arrays.
    const clipSingleLine = (
        coords: number[][],
        polygonFeature: any
    ): number[][][] => {
        if (!coords || coords.length < 2) return [];

        const lineFeature = asFeature({ type: 'LineString', coordinates: coords }, {});

        // Fast reject: no overlap at all.
        let overlaps = false;
        try {
            overlaps = booleanIntersects(lineFeature as any, polygonFeature as any);
        } catch (e) {
            overlaps = true; // be conservative on error
        }
        if (!overlaps) return [];

        // Find every crossing point between the line and the polygon boundary.
        let crossings: number[][] = [];
        try {
            const res = lineIntersect(lineFeature as any, polygonFeature as any);
            crossings = (res?.features || []).map((f: any) => f.geometry.coordinates as number[]);
        } catch (e) {
            console.warn('lineIntersect falhou para um segmento line:', e);
            // Fall back to treating the whole line as one piece; midpoint test
            // will still decide inside/outside.
            crossings = [];
        }

        // Splice crossings into the line's coordinate array, then split.
        const enriched = spliceCrossingsIntoLine(coords, crossings);
        const pieces = splitLineAtCrossings(enriched, crossings);

        // Keep the pieces whose midpoint is inside the polygon.
        const survivors: number[][][] = [];
        for (const piece of pieces) {
            if (piece.length < 2) continue;

            let inside = false;
            try {
                const first = piece[0];
                const last = piece[piece.length - 1];
                const mid = midpoint(
                    asFeature({ type: 'Point', coordinates: first }, {}) as any,
                    asFeature({ type: 'Point', coordinates: last }, {}) as any
                );
                inside = booleanPointInPolygon(mid as any, polygonFeature as any);
                // A piece whose endpoints are both exactly on the boundary and
                // whose midpoint is not classified may need a second check:
                // test all its vertices.
                if (!inside) {
                    inside = piece.some(c =>
                        booleanPointInPolygon(
                            asFeature({ type: 'Point', coordinates: c }, {}) as any,
                            polygonFeature as any
                        )
                    );
                }
            } catch (e) {
                inside = false;
            }

            if (inside) survivors.push(piece);
        }

        return survivors;
    };

    const clipLineFeature = (
        feat: any,
        polygonFeature: any
    ): GeoJSON.Feature[] => {
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
        } else {
            return [];
        }

        if (allSurvivors.length === 0) return [];

        if (allSurvivors.length === 1) {
            return [asFeature(
                { type: 'LineString', coordinates: allSurvivors[0] },
                feat.properties,
                feat.id
            )];
        }

        return [asFeature(
            { type: 'MultiLineString', coordinates: allSurvivors },
            feat.properties,
            feat.id
        )];
    };

    const clipPointFeature = (
        feat: any,
        polygonFeature: any
    ): GeoJSON.Feature[] => {
        if (feat.geometry.type === 'Point') {
            try {
                const inside = booleanPointInPolygon(
                    asFeature(feat.geometry, {}) as any,
                    polygonFeature as any
                );
                if (inside) {
                    return [asFeature(feat.geometry, feat.properties, feat.id)];
                }
            } catch (e) {
                console.warn('booleanPointInPolygon falhou para uma feição point:', e);
            }
            return [];
        }

        if (feat.geometry.type === 'MultiPoint') {
            const kept: number[][] = [];
            for (const c of feat.geometry.coordinates) {
                try {
                    const inside = booleanPointInPolygon(
                        asFeature({ type: 'Point', coordinates: c }, {}) as any,
                        polygonFeature as any
                    );
                    if (inside) kept.push(c);
                } catch (e) {
                    // Skip this coordinate if the test throws.
                }
            }
            if (kept.length === 0) return [];
            if (kept.length === 1) {
                return [asFeature({ type: 'Point', coordinates: kept[0] }, feat.properties, feat.id)];
            }
            return [asFeature({ type: 'MultiPoint', coordinates: kept }, feat.properties, feat.id)];
        }

        return [];
    };

    const clipFeaturesToPolygon = (
        features: any[],
        drawnPolygon: GeoJSON.Polygon
    ): GeoJSON.Feature[] => {
        const polygonFeature = asFeature(drawnPolygon, {});
        const out: GeoJSON.Feature[] = [];

        for (const feat of features) {
            if (!feat || !feat.geometry) continue;
            const t = feat.geometry.type;

            if (t === 'Polygon' || t === 'MultiPolygon') {
                out.push(...clipPolygonFeature(feat, polygonFeature));
            } else if (t === 'LineString' || t === 'MultiLineString') {
                out.push(...clipLineFeature(feat, polygonFeature));
            } else if (t === 'Point' || t === 'MultiPoint') {
                out.push(...clipPointFeature(feat, polygonFeature));
            } else {
                console.warn(`clip: geometry type não suportado (${t}) — feição ignorada`);
            }
        }

        return out;
    };
    // -------------------------------------------------------------------------

    const openAttributeTable = async (layerName: string) => {
        setSelectedLayerForTable(layerName);
        setShowTable(true);
        setLoadingTable(true);
        setTableError(null);
        setTableData([]);
        setTableColumns([]);
        setCurrentPage(0);

        try {
            const url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&srsName=EPSG:4674`;

            const response = needsProxy ? await proxyFetch(url) : await fetch(url);

            if (!response.ok) {
                throw new Error(`Requisição WFS falhou com status ${response.status}`);
            }

            const data = await response.json();

            if (data.features && data.features.length > 0) {
                let features: any[] = data.features;

                if (spatialFilter && spatialFilter.type === 'Polygon') {
                    features = clipFeaturesToPolygon(
                        data.features,
                        spatialFilter as GeoJSON.Polygon
                    );
                }

                if (features.length > 0) {
                    const props = features.map((feature: any) => feature.properties);
                    setTableData(props);
                    const columns = Object.keys(props[0]);
                    setTableColumns(columns);
                    zoomToFeatures(features);
                } else {
                    setTableError('Nenhuma feição encontrada na área selecionada');
                }
            } else {
                setTableError('Nenhuma feição encontrada para esta camada');
            }
        } catch (err) {
            console.error(`Falha ao buscar dados para ${layerName}:`, err);
            setTableError(err instanceof Error ? err.message : 'Falha ao buscar dados da camada');
        } finally {
            setLoadingTable(false);
        }
    };

    const fetchFilteredData = async (layerName: string, geometry?: GeoJSON.Geometry) => {
        setLoadingTable(true);
        setTableError(null);
        setTableData([]);
        setTableColumns([]);
        setCurrentPage(0);

        try {
            const url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&srsName=EPSG:4674`;

            const response = needsProxy ? await proxyFetch(url) : await fetch(url);

            if (!response.ok) {
                throw new Error(`Requisição WFS falhou com status ${response.status}`);
            }

            const data = await response.json();

            if (data.features && data.features.length > 0) {
                let features: any[] = data.features;

                if (geometry && geometry.type === 'Polygon') {
                    features = clipFeaturesToPolygon(
                        data.features,
                        geometry as GeoJSON.Polygon
                    );
                }

                if (features.length > 0) {
                    const props = features.map((feature: any) => feature.properties);
                    setTableData(props);
                    const columns = Object.keys(props[0]);
                    setTableColumns(columns);
                    zoomToFeatures(features);
                } else {
                    setTableError('Nenhuma feição encontrada na área selecionada');
                }
            } else {
                setTableError('Nenhuma feição encontrada para esta camada');
            }
        } catch (err) {
            console.error(`Falha ao buscar dados para ${layerName}:`, err);
            setTableError(err instanceof Error ? err.message : 'Falha ao buscar dados');
        } finally {
            setLoadingTable(false);
        }
    };

    const convertToCSV = (features: any[]): string => {
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
    };

    const downloadLayerByDraw = async (layerName: string, format: 'geojson' | 'shapefile' | 'csv' | 'kml') => {
        if (!spatialFilter || spatialFilter.type !== 'Polygon') {
            alert('Por favor, desenhe uma área no mapa primeiro!');
            return;
        }

        setDownloadingLayer(layerName);

        try {
            console.log('Baixando todos os dados da camada...');

            const fullDataUrl = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&srsName=EPSG:4674`;

            console.log('URL:', fullDataUrl);

            const response = needsProxy ? await proxyFetch(fullDataUrl) : await fetch(fullDataUrl);

            if (!response.ok) {
                throw new Error(`Falha ao baixar dados: ${response.status}`);
            }

            const data = await response.json();

            if (!data.features || data.features.length === 0) {
                alert('Nenhuma feição encontrada nesta camada');
                return;
            }

            console.log(`Total de feições baixadas: ${data.features.length}`);

            console.log('Recortando feições pela área desenhada (dispatch por geometria)...');

            const clippedFeatures = clipFeaturesToPolygon(
                data.features,
                spatialFilter as GeoJSON.Polygon
            );

            console.log(`Feições após recorte: ${clippedFeatures.length}`);

            if (clippedFeatures.length === 0) {
                alert('Nenhuma feição encontrada na área selecionada');
                return;
            }

            let blob: Blob;
            let fileExtension: string;

            if (format === 'geojson') {
                const clippedData = {
                    type: 'FeatureCollection',
                    features: clippedFeatures
                };
                blob = new Blob([JSON.stringify(clippedData)], { type: 'application/json' });
                fileExtension = 'geojson';
            } else if (format === 'shapefile') {
                const clippedData = {
                    type: 'FeatureCollection',
                    features: clippedFeatures
                };
                blob = new Blob([JSON.stringify(clippedData)], { type: 'application/json' });
                fileExtension = 'geojson';
                alert('Shapefile não pode ser gerado com filtro local. Baixado como GeoJSON.');
            } else if (format === 'csv') {
                const csvContent = convertToCSV(clippedFeatures);
                blob = new Blob([csvContent], { type: 'text/csv' });
                fileExtension = 'csv';
            } else if (format === 'kml') {
                const clippedData = {
                    type: 'FeatureCollection',
                    features: clippedFeatures
                };
                blob = new Blob([JSON.stringify(clippedData)], { type: 'application/json' });
                fileExtension = 'geojson';
                alert('KML não pode ser gerado com filtro local. Baixado como GeoJSON.');
            } else {
                throw new Error('Formato não suportado');
            }

            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${layerName}_area_selecionada.${fileExtension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            console.log('Download concluído com sucesso!');

        } catch (err) {
            console.error('Erro no download:', err);
            alert(`Falha ao baixar ${layerName}. Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        } finally {
            setDownloadingLayer(null);
        }
    };

    const downloadLayer = async (layerName: string, format: 'geojson' | 'shapefile' | 'csv' | 'kml') => {
        setDownloadingLayer(layerName);

        try {
            let url = '';
            let fileExtension = '';

            switch (format) {
                case 'geojson':
                    url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&srsName=EPSG:4674`;
                    fileExtension = 'geojson';
                    break;
                case 'shapefile':
                    url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=SHAPE-ZIP&srsName=EPSG:4674`;
                    fileExtension = 'zip';
                    break;
                case 'csv':
                    url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=csv&srsName=EPSG:4674`;
                    fileExtension = 'csv';
                    break;
                case 'kml':
                    url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/vnd.google-earth.kml+xml&srsName=EPSG:4674`;
                    fileExtension = 'kml';
                    break;
            }

            const response = needsProxy ? await proxyFetch(url) : await fetch(url);

            if (!response.ok) {
                throw new Error(`Falha no download com status ${response.status}`);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${layerName}.${fileExtension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

        } catch (err) {
            console.error(`Falha ao baixar camada ${layerName}:`, err);
            alert(`Falha ao baixar ${layerName}.`);
        } finally {
            setDownloadingLayer(null);
        }
    };

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return '#52bc2f';
            case 'connecting': return '#FFA726';
            case 'error': return '#e6302d';
            default: return '#9E9E9E';
        }
    };

    const handleRowsPerPageChange = (newRowsPerPage: number) => {
        const firstRowIndex = currentPage * rowsPerPage;
        const newPage = Math.floor(firstRowIndex / newRowsPerPage);
        setRowsPerPage(newRowsPerPage);
        setCurrentPage(newPage);
    };

    const totalPages = Math.ceil(tableData.length / rowsPerPage);
    const paginatedData = tableData.slice(
        currentPage * rowsPerPage,
        (currentPage + 1) * rowsPerPage
    );

    return (
        <div style={{
            position: 'relative',
            height: '100vh',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            backgroundColor: '#F7F7F7'
        }}>
            <div style={{ height: '100vh' }} ref={mapContainerRef} />

            {showServerPanel && (
                <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    width: 350,
                    backgroundColor: 'white',
                    borderRadius: 8,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh',
                    border: '1px solid #E0E0E0'
                }}>
                    <div style={{
                        padding: 15,
                        borderBottom: '1px solid #F0F0F0',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        backgroundColor: 'white'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 10
                        }}>
                            <div style={{ fontWeight: 'bold', fontSize: 14, color: '#3B3B3B' }}>Configuração do Servidor</div>
                            <button
                                onClick={() => setShowServerPanel(false)}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    fontSize: 16,
                                    padding: '0 4px',
                                    color: '#666'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ position: 'relative', marginBottom: 10 }}>
                            <span style={{
                                position: 'absolute',
                                left: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: 14,
                                color: '#999',
                                pointerEvents: 'none'
                            }}>
                                🔍
                            </span>
                            <input
                                type="text"
                                value={serverSearch}
                                onChange={(e) => {
                                    setServerSearch(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                placeholder="Pesquisar servidores"
                                style={{
                                    width: '100%',
                                    padding: '8px 10px 8px 32px',
                                    borderRadius: 4,
                                    border: '1px solid #E0E0E0',
                                    fontSize: 12,
                                    boxSizing: 'border-box',
                                    color: '#3B3B3B'
                                }}
                            />
                        </div>

                        {serverSearch && showDropdown ? (
                            <div style={{
                                maxHeight: 200,
                                overflowY: 'auto',
                                marginBottom: 10,
                                border: '1px solid #E0E0E0',
                                borderRadius: 4
                            }}>
                                {filteredServers.map(server => (
                                    <div
                                        key={server.label}
                                        onClick={() => handleServerChange(server)}
                                        style={{
                                            padding: '8px 10px',
                                            cursor: 'pointer',
                                            fontSize: 12,
                                            backgroundColor: selectedServer.label === server.label ? '#FFF5F0' : 'white',
                                            borderBottom: '1px solid #F0F0F0'
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.target as HTMLElement).style.backgroundColor = '#F5F5F5';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.target as HTMLElement).style.backgroundColor =
                                                selectedServer.label === server.label ? '#FFF5F0' : 'white';
                                        }}
                                    >
                                        <div style={{ fontWeight: 500, color: '#3B3B3B' }}>{server.label}</div>
                                        {server.url && (
                                            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                                                {server.url}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {filteredServers.length === 0 && (
                                    <div style={{ padding: '10px', fontSize: 12, color: '#999', textAlign: 'center' }}>
                                        Nenhum servidor encontrado
                                    </div>
                                )}
                            </div>
                        ) : (
                            <select
                                value={selectedServer.label}
                                onChange={(e) => {
                                    const server = SERVER_OPTIONS.find(s => s.label === e.target.value);
                                    if (server) handleServerChange(server);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    marginBottom: 10,
                                    borderRadius: 4,
                                    border: '1px solid #E0E0E0',
                                    boxSizing: 'border-box',
                                    color: '#3B3B3B'
                                }}
                            >
                                {SERVER_OPTIONS.map(server => (
                                    <option key={server.label} value={server.label}>
                                        {server.label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {selectedServer.label === 'Personalizado' && (
                            <div>
                                <input
                                    type="text"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    placeholder="Cole sua URL WMS ou WFS aqui..."
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginBottom: 5,
                                        borderRadius: 4,
                                        border: '1px solid #E0E0E0',
                                        fontSize: 12,
                                        boxSizing: 'border-box',
                                        color: '#3B3B3B'
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleCustomUrlSubmit();
                                    }}
                                />
                                <button
                                    onClick={handleCustomUrlSubmit}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        backgroundColor: '#EC6A2B',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Conectar ao Servidor Personalizado
                                </button>
                            </div>
                        )}

                        {geoserverUrl && (
                            <div style={{ marginTop: 10 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 11,
                                    color: '#666',
                                    wordBreak: 'break-all',
                                    padding: '8px',
                                    backgroundColor: '#F8F8F8',
                                    borderRadius: 4,
                                    marginBottom: 5
                                }}>
                                    <div style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        backgroundColor: getStatusColor(),
                                        flexShrink: 0
                                    }} />
                                    <span>{geoserverUrl}</span>
                                </div>
                                <div style={{ fontSize: 11, color: getStatusColor(), fontWeight: 'bold' }}>
                                    {connectionStatus === 'connected' && `✓ Conectado ${needsProxy ? '(proxy)' : '(direto)'}`}
                                    {connectionStatus === 'connecting' && '⟳ Conectando...'}
                                    {connectionStatus === 'error' && '✗ Falha na conexão'}
                                    {connectionStatus === 'idle' && 'Não conectado'}
                                </div>
                            </div>
                        )}
                    </div>

                    {isReady && geoserverUrl && activeLayers.size > 0 && (
                        <LegendBox
                            activeLayers={activeLayers}
                            baseUrl={baseUrl}
                            needsProxy={needsProxy}
                            layers={layers}
                        />
                    )}
                </div>
            )}

            {!showServerPanel && (
                <button
                    onClick={() => setShowServerPanel(true)}
                    style={{
                        position: 'absolute',
                        top: 80,
                        left: 10,
                        zIndex: 1000,
                        padding: '10px 20px',
                        backgroundColor: '#EC6A2B',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                        fontWeight: 'bold',
                        fontSize: 14
                    }}
                >
                    ⚙️ Servidores
                </button>
            )}

            {isReady && geoserverUrl && (
                <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 350,
                    maxHeight: '80vh',
                    backgroundColor: 'white',
                    borderRadius: 8,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        padding: '0',
                        borderBottom: '1px solid #F0F0F0',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px 8px 0 0',
                    }}>
                        <div style={{
                            display: 'flex',
                            borderBottom: '2px solid #F0F0F0'
                        }}>
                            <button
                                onClick={() => setActiveTab('all')}
                                style={{
                                    flex: 1,
                                    padding: '12px 15px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: activeTab === 'all' ? 'bold' : 'normal',
                                    color: activeTab === 'all' ? '#EC6A2B' : '#666',
                                    borderBottom: activeTab === 'all' ? '3px solid #EC6A2B' : '3px solid transparent',
                                    transition: 'all 0.2s',
                                    marginBottom: '-2px'
                                }}
                            >
                                📋 Todas as Camadas ({layers.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('selected')}
                                style={{
                                    flex: 1,
                                    padding: '12px 15px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: activeTab === 'selected' ? 'bold' : 'normal',
                                    color: activeTab === 'selected' ? '#EC6A2B' : '#666',
                                    borderBottom: activeTab === 'selected' ? '3px solid #EC6A2B' : '3px solid transparent',
                                    transition: 'all 0.2s',
                                    marginBottom: '-2px',
                                    position: 'relative'
                                }}
                            >
                                ⭐ Selecionadas ({activeLayers.size})
                                {activeLayers.size > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '8px',
                                        backgroundColor: '#EC6A2B',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 'bold'
                                    }}>
                                        {activeLayers.size}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Drawing Tool Section */}
                        <div style={{
                            padding: '10px 15px',
                            backgroundColor: spatialFilter ? '#FFF5F0' : '#fff',
                            borderBottom: '1px solid #F0F0F0'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: spatialFilter ? 8 : 0
                            }}>
                                <button
                                    onClick={() => {
                                        if (!drawRef.current) return;

                                        if (drawingEnabled) {
                                            drawRef.current.deleteAll();
                                            drawRef.current.changeMode('simple_select');
                                            setDrawingEnabled(false);
                                            setSpatialFilter(null);
                                        } else {
                                            if (spatialFilter) {
                                                drawRef.current.deleteAll();
                                                setSpatialFilter(null);
                                            }
                                            drawRef.current.changeMode('draw_polygon');
                                            setDrawingEnabled(true);
                                        }

                                        setTimeout(() => bringDrawLayersToFront(), 50);
                                        setTimeout(() => bringDrawLayersToFront(), 200);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: 11,
                                        backgroundColor: drawingEnabled ? '#D64A12' : '#EC6A2B',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        flex: 1
                                    }}
                                >
                                    {drawingEnabled ? '🔲 Parar Desenho' : '✏️ Desenhar Área de Interesse'}
                                </button>
                            </div>

                            {spatialFilter && (
                                <div style={{ marginTop: 8 }}>
                                    <div style={{
                                        fontSize: 11,
                                        color: '#D64A12',
                                        fontWeight: 'bold',
                                        marginBottom: 8,
                                        textAlign: 'center',
                                        backgroundColor: '#FFF5F0',
                                        padding: '4px',
                                        borderRadius: 3
                                    }}>
                                        ✅ Área de filtro ativa - Downloads serão limitados a esta área
                                    </div>

                                    <div style={{
                                        fontSize: 10,
                                        color: '#666',
                                        marginBottom: 8,
                                        textAlign: 'center'
                                    }}>
                                        Selecione uma camada abaixo para baixar apenas os dados desta área
                                    </div>

                                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                                        <button
                                            onClick={() => {
                                                if (drawRef.current) {
                                                    drawRef.current.deleteAll();
                                                }
                                                setSpatialFilter(null);
                                                setDrawingEnabled(false);
                                                if (selectedLayerForTable) {
                                                    openAttributeTable(selectedLayerForTable);
                                                }

                                                setTimeout(() => bringDrawLayersToFront(), 50);
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '4px',
                                                fontSize: 10,
                                                backgroundColor: '#EF5350',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 3,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🗑️ Limpar Área
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Active layers with draw download option */}
                        {activeLayers.size > 0 && spatialFilter && (
                            <div style={{ padding: '10px', backgroundColor: '#FFF5F0' }}>
                                <div style={{
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                    color: '#D64A12',
                                    marginBottom: 8,
                                    textAlign: 'center'
                                }}>
                                    🎯 Baixar dados da área selecionada:
                                </div>
                                {activeLayersList.map(layer => (
                                    <div key={layer.name} style={{
                                        padding: '8px',
                                        backgroundColor: 'white',
                                        marginBottom: 5,
                                        borderRadius: 4,
                                        border: '2px solid #EC6A2B'
                                    }}>
                                        <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5, color: '#3B3B3B' }}>
                                            {layer.title}
                                        </div>
                                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    downloadLayerByDraw(layer.name, 'geojson');
                                                }}
                                                disabled={downloadingLayer === layer.name}
                                                style={{
                                                    padding: '4px 8px',
                                                    fontSize: 9,
                                                    backgroundColor: '#EC6A2B',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    opacity: downloadingLayer === layer.name ? 0.7 : 1,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {downloadingLayer === layer.name ? '...' : '📦 GeoJSON'}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    downloadLayerByDraw(layer.name, 'shapefile');
                                                }}
                                                disabled={downloadingLayer === layer.name}
                                                style={{
                                                    padding: '4px 8px',
                                                    fontSize: 9,
                                                    backgroundColor: '#D64A12',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    opacity: downloadingLayer === layer.name ? 0.7 : 1,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {downloadingLayer === layer.name ? '...' : '📦 SHP'}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    downloadLayerByDraw(layer.name, 'csv');
                                                }}
                                                disabled={downloadingLayer === layer.name}
                                                style={{
                                                    padding: '4px 8px',
                                                    fontSize: 9,
                                                    backgroundColor: '#FF9800',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    opacity: downloadingLayer === layer.name ? 0.7 : 1,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {downloadingLayer === layer.name ? '...' : '📦 CSV'}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    downloadLayerByDraw(layer.name, 'kml');
                                                }}
                                                disabled={downloadingLayer === layer.name}
                                                style={{
                                                    padding: '4px 8px',
                                                    fontSize: 9,
                                                    backgroundColor: '#E91E63',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    opacity: downloadingLayer === layer.name ? 0.7 : 1,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {downloadingLayer === layer.name ? '...' : '📦 KML'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'selected' && activeLayers.size > 0 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                alignItems: 'center',
                                padding: '10px 15px',
                                gap: 6
                            }}>
                                <button
                                    onClick={removeAllLayers}
                                    style={{
                                        padding: '4px 12px',
                                        fontSize: 11,
                                        backgroundColor: '#EF5350',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    🗑️ Remover Todas
                                </button>
                                <button
                                    onClick={zoomToAllActiveLayers}
                                    style={{
                                        padding: '4px 12px',
                                        fontSize: 11,
                                        backgroundColor: '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                    title="Zoom para a extensão de todas as camadas ativas"
                                >
                                    🔍 Zoom a Todas
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '10px', borderBottom: '1px solid #F0F0F0' }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute',
                                left: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: 14,
                                color: '#999',
                                pointerEvents: 'none'
                            }}>
                                🔍
                            </span>
                            <input
                                type="text"
                                value={layerSearch}
                                onChange={(e) => setLayerSearch(e.target.value)}
                                placeholder={activeTab === 'selected' ? "Pesquisar camadas selecionadas" : "Pesquisar todas as camadas"}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px 8px 32px',
                                    borderRadius: 4,
                                    border: '1px solid #E0E0E0',
                                    fontSize: 12,
                                    boxSizing: 'border-box',
                                    color: '#3B3B3B'
                                }}
                            />
                            {layerSearch && (
                                <button
                                    onClick={() => setLayerSearch('')}
                                    style={{
                                        position: 'absolute',
                                        right: 8,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        color: '#999',
                                        padding: '0 4px'
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {layerSearch && (
                            <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
                                Mostrando {activeTab === 'selected' ? filteredActiveLayers.length : filteredLayers.length} de {activeTab === 'selected' ? activeLayers.size : layers.length} camadas correspondendo a "{layerSearch}"
                            </div>
                        )}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, padding: '10px' }}>
                        {loading && <div style={{ padding: '10px', color: '#666' }}>Carregando camadas...</div>}

                        {error && (
                            <div style={{ padding: '10px' }}>
                                <div style={{ color: '#EF5350', marginBottom: 10, fontSize: 13 }}>{error}</div>
                                <button
                                    onClick={() => fetchLayers(baseUrl)}
                                    style={{
                                        padding: '8px 15px',
                                        backgroundColor: '#EC6A2B',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        width: '100%'
                                    }}
                                >
                                    Tentar Novamente
                                </button>
                            </div>
                        )}

                        {!loading && !error && activeTab === 'all' && (
                            <>
                                {filteredLayers.map((layer) => (
                                    <div
                                        key={layer.name}
                                        style={{
                                            padding: '10px',
                                            margin: '5px 0',
                                            borderRadius: 6,
                                            backgroundColor: activeLayers.has(layer.name) ? '#FFF5F0' : '#F8F8F8',
                                            border: activeLayers.has(layer.name) ? '2px solid #EC6A2B' : '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <input
                                                type="checkbox"
                                                checked={activeLayers.has(layer.name)}
                                                onChange={() => toggleLayer(layer.name)}
                                                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, fontSize: 13, color: '#3B3B3B' }}>
                                                    {layerSearch ? (
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html: layer.title.replace(
                                                                    new RegExp(`(${layerSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                                                    '<mark style="background-color: #FFF5F0; padding: 0 2px;">$1</mark>'
                                                                )
                                                            }}
                                                        />
                                                    ) : (
                                                        layer.title
                                                    )}
                                                </div>
                                                {layer.abstract && (
                                                    <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                                                        {layer.abstract.length > 80 ? layer.abstract.substring(0, 80) + '...' : layer.abstract}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 4, marginLeft: 28, flexWrap: 'wrap' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openAttributeTable(layer.name); }}
                                                style={{
                                                    padding: '4px 10px',
                                                    fontSize: 10,
                                                    backgroundColor: '#9C27B0',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                📊 Abrir Tabela
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'geojson'); }}
                                                disabled={downloadingLayer === layer.name}
                                                style={{
                                                    padding: '4px 10px',
                                                    fontSize: 10,
                                                    backgroundColor: '#EC6A2B',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    opacity: downloadingLayer === layer.name ? 0.7 : 1
                                                }}
                                            >
                                                {downloadingLayer === layer.name ? '...' : 'GeoJSON'}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'shapefile'); }}
                                                disabled={downloadingLayer === layer.name}
                                                style={{
                                                    padding: '4px 10px',
                                                    fontSize: 10,
                                                    backgroundColor: '#D64A12',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    opacity: downloadingLayer === layer.name ? 0.7 : 1
                                                }}
                                            >
                                                {downloadingLayer === layer.name ? '...' : 'SHP'}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'csv'); }}
                                                disabled={downloadingLayer === layer.name}
                                                style={{
                                                    padding: '4px 10px',
                                                    fontSize: 10,
                                                    backgroundColor: '#FF9800',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    opacity: downloadingLayer === layer.name ? 0.7 : 1
                                                }}
                                            >
                                                {downloadingLayer === layer.name ? '...' : 'CSV'}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'kml'); }}
                                                disabled={downloadingLayer === layer.name}
                                                style={{
                                                    padding: '4px 10px',
                                                    fontSize: 10,
                                                    backgroundColor: '#E91E63',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    opacity: downloadingLayer === layer.name ? 0.7 : 1
                                                }}
                                            >
                                                {downloadingLayer === layer.name ? '...' : 'KML'}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {filteredLayers.length === 0 && (
                                    <div style={{ padding: '10px', color: '#666', textAlign: 'center' }}>
                                        {layerSearch ? `Nenhuma camada encontrada correspondendo a "${layerSearch}"` : 'Nenhuma camada encontrada'}
                                    </div>
                                )}
                            </>
                        )}

                        {!loading && !error && activeTab === 'selected' && (
                            <>
                                {activeLayers.size === 0 ? (
                                    <div style={{ padding: '30px 20px', color: '#999', textAlign: 'center' }}>
                                        <div style={{ fontSize: 40, marginBottom: 10 }}>🗺️</div>
                                        <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 5, color: '#3B3B3B' }}>
                                            Nenhuma camada selecionada                                        </div>
                                        <div style={{ fontSize: 12 }}>
                                            Marque as camadas na aba "Todas as Camadas" para adicioná-las ao mapa
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {filteredActiveLayers.map((layer) => (
                                            <div
                                                key={layer.name}
                                                style={{
                                                    padding: '12px',
                                                    margin: '5px 0',
                                                    borderRadius: 6,
                                                    backgroundColor: '#FFF5F0',
                                                    border: '2px solid #EC6A2B',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                    <div style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        backgroundColor: '#EC6A2B',
                                                        flexShrink: 0
                                                    }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: 13, color: '#3B3B3B' }}>
                                                            {layerSearch ? (
                                                                <span
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: layer.title.replace(
                                                                            new RegExp(`(${layerSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                                                            '<mark style="background-color: #FFF5F0; padding: 0 2px;">$1</mark>'
                                                                        )
                                                                    }}
                                                                />
                                                            ) : (
                                                                layer.title
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                                                            {layer.name}
                                                        </div>
                                                        {layer.abstract && (
                                                            <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                                                                {layer.abstract.length > 80 ? layer.abstract.substring(0, 80) + '...' : layer.abstract}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => toggleLayer(layer.name)}
                                                        style={{
                                                            padding: '4px 12px',
                                                            fontSize: 10,
                                                            backgroundColor: '#EF5350',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: 3,
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold'
                                                        }}
                                                        title="Remover camada"
                                                    >
                                                        ✕ Remover
                                                    </button>
                                                </div>

                                                <div style={{ display: 'flex', gap: 4, marginLeft: 14, flexWrap: 'wrap' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openAttributeTable(layer.name); }}
                                                        style={{
                                                            padding: '4px 10px',
                                                            fontSize: 10,
                                                            backgroundColor: '#9C27B0',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: 3,
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        📊 Abrir Tabela
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); zoomToLayer(layer.name); }}
                                                        style={{
                                                            padding: '4px 10px',
                                                            fontSize: 10,
                                                            backgroundColor: '#2196F3',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: 3,
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold'
                                                        }}
                                                        title="Zoom para a extensão da camada"
                                                    >
                                                        🔍 Zoom
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'geojson'); }}
                                                        disabled={downloadingLayer === layer.name}
                                                        style={{
                                                            padding: '4px 10px',
                                                            fontSize: 10,
                                                            backgroundColor: '#EC6A2B',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: 3,
                                                            cursor: 'pointer',
                                                            opacity: downloadingLayer === layer.name ? 0.7 : 1
                                                        }}
                                                    >
                                                        {downloadingLayer === layer.name ? '...' : 'GeoJSON'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'shapefile'); }}
                                                        disabled={downloadingLayer === layer.name}
                                                        style={{
                                                            padding: '4px 10px',
                                                            fontSize: 10,
                                                            backgroundColor: '#D64A12',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: 3,
                                                            cursor: 'pointer',
                                                            opacity: downloadingLayer === layer.name ? 0.7 : 1
                                                        }}
                                                    >
                                                        {downloadingLayer === layer.name ? '...' : 'SHP'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'csv'); }}
                                                        disabled={downloadingLayer === layer.name}
                                                        style={{
                                                            padding: '4px 10px',
                                                            fontSize: 10,
                                                            backgroundColor: '#FF9800',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: 3,
                                                            cursor: 'pointer',
                                                            opacity: downloadingLayer === layer.name ? 0.7 : 1
                                                        }}
                                                    >
                                                        {downloadingLayer === layer.name ? '...' : 'CSV'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'kml'); }}
                                                        disabled={downloadingLayer === layer.name}
                                                        style={{
                                                            padding: '4px 10px',
                                                            fontSize: 10,
                                                            backgroundColor: '#E91E63',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: 3,
                                                            cursor: 'pointer',
                                                            opacity: downloadingLayer === layer.name ? 0.7 : 1
                                                        }}
                                                    >
                                                        {downloadingLayer === layer.name ? '...' : 'KML'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {filteredActiveLayers.length === 0 && layerSearch && (
                                            <div style={{ padding: '10px', color: '#666', textAlign: 'center' }}>
                                                Nenhuma camada selecionada correspondendo a "{layerSearch}"
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ATTRIBUTE TABLE */}
            {showTable && selectedLayerForTable && (
                <div
                    ref={tableRef}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${tableHeight}vh`,
                        backgroundColor: 'white',
                        borderTop: '3px solid #EC6A2B',
                        boxShadow: '0 -8px 30px rgba(0,0,0,0.2)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '0 30px',
                        boxSizing: 'border-box',
                        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    }}
                >
                    <div
                        onMouseDown={handleDragStart}
                        style={{
                            position: 'absolute',
                            top: -8,
                            left: 0,
                            right: 0,
                            height: 16,
                            cursor: 'row-resize',
                            zIndex: 10000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <div style={{
                            width: 60,
                            height: 5,
                            backgroundColor: '#bbb',
                            borderRadius: 3,
                            transition: 'background-color 0.2s'
                        }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.backgroundColor = '#EC6A2B';
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.backgroundColor = '#bbb';
                            }}
                        />
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        backgroundColor: '#F8F8F8',
                        borderBottom: '1px solid #F0F0F0',
                        marginTop: '4px',
                        flexShrink: 0,
                        flexWrap: 'wrap',
                        gap: 8
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontWeight: 'bold', fontSize: 14, color: '#3B3B3B' }}>
                                📊 Tabela de Atributos
                            </div>
                            <div style={{
                                fontSize: 12,
                                color: '#666',
                                backgroundColor: '#FFF5F0',
                                padding: '2px 10px',
                                borderRadius: 10
                            }}>
                                {layers.find(l => l.name === selectedLayerForTable)?.title || selectedLayerForTable}
                            </div>
                            {spatialFilter && (
                                <div style={{
                                    fontSize: 11,
                                    color: '#D64A12',
                                    backgroundColor: '#FFF5F0',
                                    padding: '2px 10px',
                                    borderRadius: 10,
                                    fontWeight: 'bold'
                                }}>
                                    🎯 Dados Filtrados
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                fontSize: 11,
                                color: '#333',
                                backgroundColor: '#F0F0F0',
                                padding: '4px 10px',
                                borderRadius: 4,
                                fontWeight: 500
                            }}>
                                {tableData.length} feições ({totalPages} páginas)
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 10, color: '#888' }}>por pág:</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                                    style={{
                                        padding: '3px 4px',
                                        fontSize: 10,
                                        border: '1px solid #E0E0E0',
                                        borderRadius: 3,
                                        cursor: 'pointer',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={200}>200</option>
                                    <option value={500}>500</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <button
                                    onClick={() => setCurrentPage(0)}
                                    disabled={currentPage === 0}
                                    title="Primeira página"
                                    style={{
                                        padding: '4px 6px',
                                        fontSize: 11,
                                        backgroundColor: currentPage === 0 ? '#E0E0E0' : '#EC6A2B',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 3,
                                        cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                                        lineHeight: 1
                                    }}
                                >
                                    ⏮
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                    disabled={currentPage === 0}
                                    title="Página anterior"
                                    style={{
                                        padding: '4px 6px',
                                        fontSize: 11,
                                        backgroundColor: currentPage === 0 ? '#E0E0E0' : '#EC6A2B',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 3,
                                        cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                                        lineHeight: 1
                                    }}
                                >
                                    ◀
                                </button>

                                <input
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={currentPage + 1}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (val >= 1 && val <= totalPages) {
                                            setCurrentPage(val - 1);
                                        }
                                    }}
                                    title="Ir para página"
                                    style={{
                                        width: '40px',
                                        padding: '3px 4px',
                                        fontSize: 11,
                                        border: '1px solid #EC6A2B',
                                        borderRadius: 3,
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        color: '#EC6A2B'
                                    }}
                                />

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={currentPage >= totalPages - 1}
                                    title="Próxima página"
                                    style={{
                                        padding: '4px 6px',
                                        fontSize: 11,
                                        backgroundColor: currentPage >= totalPages - 1 ? '#E0E0E0' : '#EC6A2B',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 3,
                                        cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                                        lineHeight: 1
                                    }}
                                >
                                    ▶
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages - 1)}
                                    disabled={currentPage >= totalPages - 1}
                                    title="Última página"
                                    style={{
                                        padding: '4px 6px',
                                        fontSize: 11,
                                        backgroundColor: currentPage >= totalPages - 1 ? '#E0E0E0' : '#EC6A2B',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 3,
                                        cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                                        lineHeight: 1
                                    }}
                                >
                                    ⏭
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    setShowTable(false);
                                    setSelectedLayerForTable(null);
                                }}
                                style={{
                                    padding: '6px 15px',
                                    fontSize: 12,
                                    backgroundColor: '#EF5350',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    marginLeft: 8
                                }}
                            >
                                ✕ Fechar Tabela
                            </button>
                        </div>
                    </div>

                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        position: 'relative',
                        minHeight: 0,
                        paddingBottom: '60px'
                    }}>
                        {loadingTable ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                color: '#666',
                                fontSize: 14
                            }}>
                                Carregando dados dos atributos...
                            </div>
                        ) : tableError ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                color: '#EF5350',
                                fontSize: 14
                            }}>
                                {tableError}
                            </div>
                        ) : (
                            <div style={{
                                overflowX: 'scroll',
                                overflowY: 'auto',
                                height: '100%',
                                width: '100%',
                            }}>
                                <table style={{
                                    width: 'max-content',
                                    minWidth: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: 11
                                }}>
                                    <thead>
                                        <tr style={{
                                            position: 'sticky',
                                            top: 0,
                                            backgroundColor: '#F8F8F8',
                                            zIndex: 1,
                                        }}>
                                            <th style={{
                                                padding: '8px 12px',
                                                borderBottom: '2px solid #EC6A2B',
                                                backgroundColor: '#FFF5F0',
                                                textAlign: 'left',
                                                fontWeight: 'bold',
                                                color: '#3B3B3B',
                                                minWidth: '60px',
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 2
                                            }}>
                                                #
                                            </th>
                                            {tableColumns.map(column => (
                                                <th key={column} style={{
                                                    padding: '8px 12px',
                                                    borderBottom: '2px solid #EC6A2B',
                                                    backgroundColor: '#FFF5F0',
                                                    textAlign: 'left',
                                                    fontWeight: 'bold',
                                                    color: '#3B3B3B',
                                                    minWidth: '150px',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {column}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedData.map((row, index) => (
                                            <tr
                                                key={index}
                                                style={{
                                                    backgroundColor: index % 2 === 0 ? 'white' : '#FAFAFA',
                                                    borderBottom: '1px solid #F0F0F0'
                                                }}
                                                onMouseEnter={(e) => {
                                                    (e.currentTarget as HTMLElement).style.backgroundColor = '#FFF5F0';
                                                }}
                                                onMouseLeave={(e) => {
                                                    (e.currentTarget as HTMLElement).style.backgroundColor = index % 2 === 0 ? 'white' : '#FAFAFA';
                                                }}
                                            >
                                                <td style={{
                                                    padding: '6px 12px',
                                                    color: '#999',
                                                    fontWeight: 'bold',
                                                    position: 'sticky',
                                                    left: 0,
                                                    backgroundColor: index % 2 === 0 ? 'white' : '#FAFAFA',
                                                    zIndex: 0
                                                }}>
                                                    {currentPage * rowsPerPage + index + 1}
                                                </td>
                                                {tableColumns.map(column => (
                                                    <td key={column} style={{
                                                        padding: '6px 12px',
                                                        color: '#333',
                                                        maxWidth: '300px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {row[column] !== null && row[column] !== undefined ? String(row[column]) : 'NULO'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {!loadingTable && !tableError && tableData.length > 0 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 0',
                            backgroundColor: '#F8F8F8',
                            borderTop: '1px solid #F0F0F0',
                            fontSize: 11,
                            flexShrink: 0
                        }}>
                            <div style={{ color: '#666' }}>
                                Mostrando {currentPage * rowsPerPage + 1} - {Math.min((currentPage + 1) * rowsPerPage, tableData.length)} de {tableData.length} feições
                            </div>
                            <div style={{ color: '#888', fontSize: 10 }}>
                                Página {currentPage + 1} de {totalPages}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BaseMap;