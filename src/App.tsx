// BaseMap.tsx
import mapboxgl from "mapbox-gl"
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState, useCallback } from "react";

interface WMSLayer {
  name: string;
  title: string;
  abstract?: string;
}

const CORS_PROXY = 'https://corsproxy.io/?';

// --- ORGANIZED SERVER LIST WITH ALL 53 CONNECTIONS + CUSTOM OPTION ---
const SERVER_OPTIONS = [
  // --- IBGE (grouped together for easy access) ---
  { label: 'IBGE - Malhas Territoriais', url: 'https://geoservicos.ibge.gov.br/geoserver/ows' },
  { label: 'IBGE - CENSO 2022', url: 'https://geoservicoscenso2022.ibge.gov.br/geoserver/censo2022/ows' },
  { label: 'IBGE - ODS (Objetivos de Desenvolvimento Sustentável)', url: 'https://geoservicos.ibge.gov.br/geoserver/ODS/ows' },

  // --- Federal Government ---
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

  // --- Ministries ---
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

  // --- State & Municipal ---
  { label: 'DataGeo - São Paulo', url: 'https://datageo.ambiente.sp.gov.br/geoserver/ows' },
  { label: 'IDE SISEMA (MG)', url: 'https://geoserver.meioambiente.mg.gov.br/ows' },
  { label: 'IDE-GEOBASES (ES)', url: 'https://ide.geobases.es.gov.br/geoserver/ows' },
  { label: 'INEA (RJ)', url: 'https://geoservicos.inde.gov.br/geoserver/INEA/ows' },
  { label: 'Prefeitura BH (MG) - BH Map', url: 'https://bhmap.pbh.gov.br/v2/api/idebhgeo/wms' },
  { label: 'Prefeitura BH (MG) - Geoservicos', url: 'https://geoservicos.pbh.gov.br/geoserver/ows' },
  { label: 'PRODEMG (MG)', url: 'http://geoserver.prodemge.gov.br/geoserver/ows' },
  { label: 'SEMACE (CE)', url: 'https://geoservicos.inde.gov.br/geoserver/SEMACE/ows' },
  { label: 'SEPLAN (TO)', url: 'https://geoportal.to.gov.br/geoserver/ows' },

  // --- Other ---
  { label: 'INDE Catalog', url: 'https://geoservicos.inde.gov.br/geoserver/wfs' },
  { label: 'MapBiomas Alerta', url: 'https://maps.alerta.mapbiomas.org/geoserver/wfs' },
  { label: 'UFABC', url: 'https://geoservicos.inde.gov.br/geoserver/UFABC/ows' },

  // Custom option (Allows users to add their own WMS or WFS URL)
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

  // Keep track of current server's layers to clean up properly
  const currentServerLayersRef = useRef<Set<string>>(new Set());

  const proxyFetch = async (url: string): Promise<Response> => {
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Proxy returned ${response.status}`);
    return response;
  };

  // Cleanup function to remove all layers from the map
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

  // Initialize map
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

    // Clean up all existing layers before fetching new ones
    cleanupAllLayers();
    setLayers([]);
    setActiveLayers(new Set());

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
        // Use name as key to deduplicate, keeping first occurrence
        if (!layersMap.has(name)) {
          layersMap.set(name, {
            name,
            title,
            abstract: layerEl.querySelector('Abstract')?.textContent || undefined
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
            abstract: layerEl.querySelector('Abstract')?.textContent || undefined
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
    // Clean up all existing layers from map before switching
    cleanupAllLayers();

    setSelectedServer(server);
    if (server.url) {
      setGeoserverUrl(server.url);
      setCustomUrl('');
    } else {
      setGeoserverUrl('');
    }
  };

  const handleCustomUrlSubmit = () => {
    if (customUrl.trim()) {
      // Clean up all existing layers from map before switching
      cleanupAllLayers();
      setGeoserverUrl(customUrl.trim());
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
              border: '1px solid #ddd'
            }}
          >
            {SERVER_OPTIONS.map(server => (
              <option key={server.label} value={server.label}>
                {server.label}
              </option>
            ))}
          </select>

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
                  fontSize: 12
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
          <div style={{
            padding: '15px',
            borderBottom: '1px solid #eee',
            fontWeight: 'bold',
            fontSize: 16,
            backgroundColor: '#f8f9fa',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Layers</span>
            <span style={{ fontSize: 11, color: '#666', fontWeight: 'normal' }}>
              {layers.length} layers
            </span>
          </div>

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

            {!loading && !error && layers.map((layer) => (
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
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{layer.title}</div>
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

            {!loading && !error && layers.length === 0 && (
              <div style={{ padding: '10px', color: '#666' }}>No layers found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseMap;