// BaseMap.tsx
import mapboxgl from "mapbox-gl"
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState, useCallback } from "react";

interface WMSLayer {
  name: string;
  title: string;
  abstract?: string;
}

interface FeatureProperties {
  [key: string]: any;
}

const CORS_PROXY = 'https://corsproxy.io/?';

// --- ORGANIZED SERVER LIST ---
const SERVER_OPTIONS = [
  { label: 'IBGE - Malhas Territoriais', url: 'https://geoservicos.ibge.gov.br/geoserver/ows' },
  { label: 'IBGE - CENSO 2022', url: 'https://geoservicoscenso2022.ibge.gov.br/geoserver/censo2022/ows' },
  { label: 'IBGE - ODS', url: 'https://geoservicos.ibge.gov.br/geoserver/ODS/ows' },
  { label: 'ANATEL', url: 'https://sistemas.anatel.gov.br/geoserver/ows' },
  { label: 'ANP', url: 'https://gishub.anp.gov.br/geoserver/ows' },
  { label: 'ANTT', url: 'https://geoservicos.inde.gov.br/geoserver/ANTT/ows' },
  { label: 'BNDES', url: 'https://geoservicos.inde.gov.br/geoserver/BNDES/ows' },
  { label: 'Censipam', url: 'https://panorama.sipam.gov.br/geoserver/publico/ows' },
  { label: 'CPRM / SGB', url: 'https://geoservicos.sgb.gov.br/geoserver/geologia/ows' },
  { label: 'DNIT', url: 'https://geoservicos.inde.gov.br/geoserver/DNIT/ows' },
  { label: 'EMBRAPA', url: 'https://geoinfo.dados.embrapa.br/geoserver/ows' },
  { label: 'EPE', url: 'https://geoservicos.inde.gov.br/geoserver/EPE/ows' },
  { label: 'FUNAI', url: 'https://geoserver.funai.gov.br/geoserver/ows' },
  { label: 'FUNAI/CMR', url: 'https://cmr.funai.gov.br/geoserver/ows' },
  { label: 'ICA', url: 'https://geoaissweb.decea.gov.br/geoserver/ICA/ows' },
  { label: 'ICMBIO', url: 'https://geoservicos.inde.gov.br/geoserver/ICMBio/ows' },
  { label: 'INPE', url: 'https://terrabrasilis.dpi.inpe.br/geoserver/ows' },
  { label: 'IPHAN', url: 'https://geoserver.iphan.gov.br/geoserver/ows' },
  { label: 'MB/COMPAAz', url: 'https://geoservicos.inde.gov.br/geoserver/COMPAAz/ows' },
  { label: 'MB/DPC', url: 'https://geoservicos.inde.gov.br/geoserver/DPC/ows' },
  { label: 'MB/DPHDM', url: 'https://geoservicos.inde.gov.br/geoserver/DPHDM/ows' },
  { label: 'MDIC', url: 'https://geoservicos.inde.gov.br/geoserver/MDIC/ows' },
  { label: 'MMA', url: 'https://geoservicos.inde.gov.br/geoserver/MMA/ows' },
  { label: 'MPA', url: 'https://geoservicos.inde.gov.br/geoserver/MPA/ows' },
  { label: 'MPO', url: 'https://geoservicos.inde.gov.br/geoserver/MPOG/ows' },
  { label: 'MS/IDE-MS', url: 'https://ide.saude.gov.br/geoserver/ows' },
  { label: 'MTR', url: 'https://geoservicos.inde.gov.br/geoserver/MInfra/ows' },
  { label: 'MTUR', url: 'https://geoservicos.inde.gov.br/geoserver/MTU/ows' },
  { label: 'PGGM', url: 'https://geoservicos.inde.gov.br/geoserver/PGGM/ows' },
  { label: 'SPU', url: 'https://geoservicos.inde.gov.br/geoserver/SPU/ows' },
  { label: 'VALEC', url: 'https://geoservicos.inde.gov.br/geoserver/VALEC/ows' },
  { label: 'DataGeo - São Paulo', url: 'https://datageo.ambiente.sp.gov.br/geoserver/ows' },
  { label: 'IDE SISEMA (MG)', url: 'https://geoserver.meioambiente.mg.gov.br/ows' },
  { label: 'IDE-GEOBASES (ES)', url: 'https://ide.geobases.es.gov.br/geoserver/ows' },
  { label: 'INEA (RJ)', url: 'https://geoservicos.inde.gov.br/geoserver/INEA/ows' },
  { label: 'Prefeitura BH (MG) - BH Map', url: 'https://bhmap.pbh.gov.br/v2/api/idebhgeo/wms' },
  { label: 'Prefeitura BH (MG) - Geoservicos', url: 'https://geoservicos.pbh.gov.br/geoserver/ows' },
  { label: 'PRODEMG (MG)', url: 'http://geoserver.prodemge.gov.br/geoserver/ows' },
  { label: 'SEMACE (CE)', url: 'https://geoservicos.inde.gov.br/geoserver/SEMACE/ows' },
  { label: 'SEPLAN (TO)', url: 'https://geoportal.to.gov.br/geoserver/ows' },
  { label: 'INDE Catalog', url: 'https://geoservicos.inde.gov.br/geoserver/wfs' },
  { label: 'MapBiomas Alerta', url: 'https://maps.alerta.mapbiomas.org/geoserver/wfs' },
  { label: 'UFABC', url: 'https://geoservicos.inde.gov.br/geoserver/UFABC/ows' },
  { label: 'Custom', url: '' }
];

const BaseMap = () => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  // Search states
  const [serverSearch, setServerSearch] = useState('');
  const [layerSearch, setLayerSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // --- Tab State ---
  const [activeTab, setActiveTab] = useState<'all' | 'selected'>('all');

  // --- Attribute Table State ---
  const [showTable, setShowTable] = useState(false);
  const [selectedLayerForTable, setSelectedLayerForTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<FeatureProperties[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 50;

  const currentServerLayersRef = useRef<Set<string>>(new Set());

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
    if (!response.ok) throw new Error(`Proxy returned ${response.status}`);
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
        console.warn(`Error removing layer ${layerName}:`, e);
      }
    });

    currentServerLayersRef.current.clear();
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
    });

    return () => {
      theBaseMap.remove();
      mapRef.current = null;
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
        throw new Error('No layers found. Check the URL.');
      }

      setNeedsProxy(requiresProxy);
      setLayers(parsedLayers);
      setConnectionStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch layers');
      setConnectionStatus('error');
      console.error('Fetch error:', err);
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

      // Close table if removing the layer being viewed
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
  };

  const openAttributeTable = async (layerName: string) => {
    setSelectedLayerForTable(layerName);
    setShowTable(true);
    setLoadingTable(true);
    setTableError(null);
    setTableData([]);
    setTableColumns([]);
    setCurrentPage(0);

    try {
      const url = `${baseUrl}?service=WFS&version=2.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&count=1000&srsName=EPSG:4674`;

      const response = needsProxy ? await proxyFetch(url) : await fetch(url);

      if (!response.ok) {
        throw new Error(`WFS request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const props = data.features.map((feature: any) => feature.properties);
        setTableData(props);

        // Extract column names from first feature
        const columns = Object.keys(props[0]);
        setTableColumns(columns);
      } else {
        setTableError('No features found for this layer');
      }
    } catch (err) {
      console.error(`Failed to fetch data for ${layerName}:`, err);
      setTableError(err instanceof Error ? err.message : 'Failed to fetch layer data');
    } finally {
      setLoadingTable(false);
    }
  };

  const downloadLayer = async (layerName: string, format: 'geojson' | 'shapefile' | 'csv') => {
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
      }

      const response = needsProxy ? await proxyFetch(url) : await fetch(url);

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
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
      console.error(`Failed to download layer ${layerName}:`, err);
      alert(`Failed to download ${layerName}. The server might not support WFS downloads or the requested format.`);
    } finally {
      setDownloadingLayer(null);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FFA726';
      case 'error': return '#EF5350';
      default: return '#9E9E9E';
    }
  };

  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const paginatedData = tableData.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <div style={{ height: '100vh' }} ref={mapContainerRef} />

      {showServerPanel ? (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          width: 350,
          backgroundColor: 'white',
          borderRadius: 8,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          zIndex: 1000,
          padding: 15,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10
          }}>
            <div style={{ fontWeight: 'bold', fontSize: 14 }}>Server Configuration</div>
            <button
              onClick={() => setShowServerPanel(false)}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 16,
                padding: '0 4px'
              }}
            >
              ✕
            </button>
          </div>

          {/* SERVER SEARCH */}
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
              placeholder="Search servers"
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                borderRadius: 4,
                border: '1px solid #ddd',
                fontSize: 12,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* SERVER DROPDOWN / SEARCH RESULTS */}
          {serverSearch && showDropdown ? (
            <div style={{
              maxHeight: 200,
              overflowY: 'auto',
              marginBottom: 10,
              border: '1px solid #ddd',
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
                    backgroundColor: selectedServer.label === server.label ? '#e3f2fd' : 'white',
                    borderBottom: '1px solid #eee'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor =
                      selectedServer.label === server.label ? '#e3f2fd' : 'white';
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{server.label}</div>
                  {server.url && (
                    <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                      {server.url}
                    </div>
                  )}
                </div>
              ))}
              {filteredServers.length === 0 && (
                <div style={{ padding: '10px', fontSize: 12, color: '#999', textAlign: 'center' }}>
                  No servers found
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
                border: '1px solid #ddd',
                boxSizing: 'border-box'
              }}
            >
              {SERVER_OPTIONS.map(server => (
                <option key={server.label} value={server.label}>
                  {server.label}
                </option>
              ))}
            </select>
          )}

          {selectedServer.label === 'Custom' && (
            <div>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Paste your WMS or WFS URL here..."
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: 5,
                  borderRadius: 4,
                  border: '1px solid #ddd',
                  fontSize: 12,
                  boxSizing: 'border-box'
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
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Connect to Custom Server
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
                backgroundColor: '#f5f5f5',
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
                {connectionStatus === 'connected' && `✓ Connected ${needsProxy ? '(proxy)' : '(direct)'}`}
                {connectionStatus === 'connecting' && '⟳ Connecting...'}
                {connectionStatus === 'error' && '✗ Connection failed'}
                {connectionStatus === 'idle' && 'Not connected'}
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowServerPanel(true)}
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1000,
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            fontWeight: 'bold',
            fontSize: 14
          }}
        >
          ⚙️ Servers
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

          {/* --- HEADER WITH TABS --- */}
          <div style={{
            padding: '0',
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px 8px 0 0',
          }}>
            <div style={{
              display: 'flex',
              borderBottom: '2px solid #e0e0e0'
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
                  color: activeTab === 'all' ? '#2196F3' : '#666',
                  borderBottom: activeTab === 'all' ? '3px solid #2196F3' : '3px solid transparent',
                  transition: 'all 0.2s',
                  marginBottom: '-2px'
                }}
              >
                📋 All Layers ({layers.length})
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
                  color: activeTab === 'selected' ? '#2196F3' : '#666',
                  borderBottom: activeTab === 'selected' ? '3px solid #2196F3' : '3px solid transparent',
                  transition: 'all 0.2s',
                  marginBottom: '-2px',
                  position: 'relative'
                }}
              >
                ⭐ Selected ({activeLayers.size})
                {activeLayers.size > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '6px',
                    right: '8px',
                    backgroundColor: '#2196F3',
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

            {activeTab === 'selected' && activeLayers.size > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                padding: '10px 15px',
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
                  🗑️ Remove All
                </button>
              </div>
            )}
          </div>

          {/* LAYER SEARCH */}
          <div style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
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
                placeholder={activeTab === 'selected' ? "Search selected layers" : "Search all layers"}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 32px',
                  borderRadius: 4,
                  border: '1px solid #ddd',
                  fontSize: 12,
                  boxSizing: 'border-box'
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
                Showing {activeTab === 'selected' ? filteredActiveLayers.length : filteredLayers.length} of {activeTab === 'selected' ? activeLayers.size : layers.length} layers matching "{layerSearch}"
              </div>
            )}
          </div>

          {/* LAYERS LIST */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '10px' }}>
            {loading && <div style={{ padding: '10px', color: '#666' }}>Loading layers...</div>}

            {error && (
              <div style={{ padding: '10px' }}>
                <div style={{ color: 'red', marginBottom: 10, fontSize: 13 }}>{error}</div>
                <button
                  onClick={() => fetchLayers(baseUrl)}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* ALL LAYERS TAB */}
            {!loading && !error && activeTab === 'all' && (
              <>
                {filteredLayers.map((layer) => (
                  <div
                    key={layer.name}
                    style={{
                      padding: '10px',
                      margin: '5px 0',
                      borderRadius: 6,
                      backgroundColor: activeLayers.has(layer.name) ? '#e3f2fd' : '#f5f5f5',
                      border: activeLayers.has(layer.name) ? '2px solid #2196f3' : '1px solid transparent',
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
                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                          {layerSearch ? (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: layer.title.replace(
                                  new RegExp(`(${layerSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                  '<mark style="background-color: #fff176; padding: 0 2px;">$1</mark>'
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

                    <div style={{ display: 'flex', gap: 4, marginLeft: 28 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'geojson'); }}
                        disabled={downloadingLayer === layer.name}
                        style={{
                          padding: '4px 10px',
                          fontSize: 10,
                          backgroundColor: '#4CAF50',
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
                          backgroundColor: '#2196F3',
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
                    </div>
                  </div>
                ))}

                {filteredLayers.length === 0 && (
                  <div style={{ padding: '10px', color: '#666', textAlign: 'center' }}>
                    {layerSearch ? `No layers found matching "${layerSearch}"` : 'No layers found'}
                  </div>
                )}
              </>
            )}

            {/* SELECTED LAYERS TAB */}
            {!loading && !error && activeTab === 'selected' && (
              <>
                {activeLayers.size === 0 ? (
                  <div style={{ padding: '30px 20px', color: '#999', textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🗺️</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>
                      No layers selected
                    </div>
                    <div style={{ fontSize: 12 }}>
                      Check layers in the "All Layers" tab to add them to your map
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
                          backgroundColor: '#e3f2fd',
                          border: '2px solid #2196f3',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: '#2196F3',
                            flexShrink: 0
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {layerSearch ? (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: layer.title.replace(
                                      new RegExp(`(${layerSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                      '<mark style="background-color: #fff176; padding: 0 2px;">$1</mark>'
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
                            title="Remove layer"
                          >
                            ✕ Remove
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
                            📊 Open Table
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'geojson'); }}
                            disabled={downloadingLayer === layer.name}
                            style={{
                              padding: '4px 10px',
                              fontSize: 10,
                              backgroundColor: '#4CAF50',
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
                              backgroundColor: '#2196F3',
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
                        </div>
                      </div>
                    ))}

                    {filteredActiveLayers.length === 0 && layerSearch && (
                      <div style={{ padding: '10px', color: '#666', textAlign: 'center' }}>
                        No selected layers matching "{layerSearch}"
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ATTRIBUTE TABLE - Bottom Panel like ArcGIS Pro */}
      {showTable && selectedLayerForTable && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '35vh',
          backgroundColor: 'white',
          borderTop: '3px solid #2196F3',
          boxShadow: '0 -4px 15px rgba(0,0,0,0.2)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 15px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontWeight: 'bold', fontSize: 14, color: '#333' }}>
                📊 Attribute Table
              </div>
              <div style={{
                fontSize: 12,
                color: '#666',
                backgroundColor: '#e3f2fd',
                padding: '2px 10px',
                borderRadius: 10
              }}>
                {layers.find(l => l.name === selectedLayerForTable)?.title || selectedLayerForTable}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                {tableData.length} features
              </div>
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
                fontWeight: 'bold'
              }}
            >
              ✕ Close Table
            </button>
          </div>

          {/* Table Content */}
          <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
            {loadingTable ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#666',
                fontSize: 14
              }}>
                Loading attribute data...
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
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 11
              }}>
                <thead>
                  <tr style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f0f0f0',
                    zIndex: 1
                  }}>
                    <th style={{
                      padding: '8px 12px',
                      borderBottom: '2px solid #2196F3',
                      backgroundColor: '#e3f2fd',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#333',
                      minWidth: '60px'
                    }}>
                      #
                    </th>
                    {tableColumns.map(column => (
                      <th key={column} style={{
                        padding: '8px 12px',
                        borderBottom: '2px solid #2196F3',
                        backgroundColor: '#e3f2fd',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        color: '#333',
                        minWidth: '120px',
                        whiteSpace: 'nowrap'
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
                        backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                        borderBottom: '1px solid #e0e0e0'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#e3f2fd';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = index % 2 === 0 ? 'white' : '#fafafa';
                      }}
                    >
                      <td style={{
                        padding: '6px 12px',
                        color: '#999',
                        fontWeight: 'bold'
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
                          {row[column] !== null && row[column] !== undefined ? String(row[column]) : 'NULL'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Footer with Pagination */}
          {!loadingTable && !tableError && tableData.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 15px',
              backgroundColor: '#f8f9fa',
              borderTop: '1px solid #e0e0e0',
              fontSize: 11
            }}>
              <div style={{ color: '#666' }}>
                Showing {currentPage * rowsPerPage + 1} - {Math.min((currentPage + 1) * rowsPerPage, tableData.length)} of {tableData.length} features
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(0)}
                  disabled={currentPage === 0}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    backgroundColor: currentPage === 0 ? '#e0e0e0' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: 3,
                    cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ⏮ First
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    backgroundColor: currentPage === 0 ? '#e0e0e0' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: 3,
                    cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ◀ Prev
                </button>
                <span style={{ color: '#666', fontWeight: 'bold' }}>
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    backgroundColor: currentPage >= totalPages - 1 ? '#e0e0e0' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: 3,
                    cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next ▶
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    backgroundColor: currentPage >= totalPages - 1 ? '#e0e0e0' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: 3,
                    cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Last ⏭
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BaseMap;