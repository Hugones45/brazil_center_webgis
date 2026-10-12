// src/mapviwer-components/LayersPanel.tsx

interface LayersPanelProps {
    isReady: boolean;
    geoserverUrl: string;
    layers: any[];
    activeLayers: Set<string>;
    activeTab: 'all' | 'selected';
    setActiveTab: (val: 'all' | 'selected') => void;
    layersPanelCollapsed: boolean;
    setLayersPanelCollapsed: (val: boolean) => void;
    spatialFilter: GeoJSON.Geometry | null;
    drawingEnabled: boolean;
    handleDrawingToggle: () => void;
    downloadLayerByDraw: (layerName: string, format: 'geojson' | 'shapefile' | 'csv' | 'kml') => void;
    downloadingLayer: string | null;
    removeAllLayers: () => void;
    zoomToAllActiveLayers: () => void;
    layerSearch: string;
    setLayerSearch: (val: string) => void;
    loading: boolean;
    error: string | null;
    fetchLayers: (baseUrl: string) => void;
    baseUrl: string;
    filteredLayers: any[];
    toggleLayer: (layerName: string) => void;
    openAttributeTable: (layerName: string) => void;
    downloadLayer: (layerName: string, format: 'geojson' | 'shapefile' | 'csv' | 'kml') => void;
    filteredActiveLayers: any[];
    zoomToLayer: (layerName: string) => void;
    activeLayersList: any[];
    setSpatialFilter: (val: GeoJSON.Geometry | null) => void;
    setDrawingEnabled: (val: boolean) => void;
    drawRef: React.MutableRefObject<any>;
    bringDrawLayersToFront: () => void;
}

export const LayersPanel = ({
    isReady, geoserverUrl, layers, activeLayers, activeTab, setActiveTab,
    layersPanelCollapsed, setLayersPanelCollapsed, spatialFilter, drawingEnabled,
    handleDrawingToggle, downloadLayerByDraw, downloadingLayer, removeAllLayers,
    zoomToAllActiveLayers, layerSearch, setLayerSearch, loading, error, fetchLayers,
    baseUrl, filteredLayers, toggleLayer, openAttributeTable, downloadLayer,
    filteredActiveLayers, zoomToLayer, activeLayersList, setSpatialFilter,
    setDrawingEnabled, drawRef, bringDrawLayersToFront
}: LayersPanelProps) => {

    if (!isReady || !geoserverUrl) return null;

    return (
        <div style={{ position: 'absolute', top: 10, right: 10, width: 350, maxHeight: '80vh', backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0', borderBottom: layersPanelCollapsed ? 'none' : '1px solid #F0F0F0', backgroundColor: '#FFFFFF', borderRadius: '8px 8px 0 0' }}>
                <div style={{ display: 'flex', borderBottom: '2px solid #F0F0F0' }}>
                    <button onClick={() => setActiveTab('all')} style={{ flex: 1, padding: '12px 15px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === 'all' ? 'bold' : 'normal', color: activeTab === 'all' ? '#EC6A2B' : '#666', borderBottom: activeTab === 'all' ? '3px solid #EC6A2B' : '3px solid transparent', transition: 'all 0.2s', marginBottom: '-2px' }}>📋 Todas as Camadas ({layers.length})</button>
                    <button onClick={() => setActiveTab('selected')} style={{ flex: 1, padding: '12px 15px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === 'selected' ? 'bold' : 'normal', color: activeTab === 'selected' ? '#EC6A2B' : '#666', borderBottom: activeTab === 'selected' ? '3px solid #EC6A2B' : '3px solid transparent', transition: 'all 0.2s', marginBottom: '-2px', position: 'relative' }}>
                        ⭐ Selecionadas ({activeLayers.size})
                        {activeLayers.size > 0 && <span style={{ position: 'absolute', top: '6px', right: '8px', backgroundColor: '#EC6A2B', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>{activeLayers.size}</span>}
                    </button>
                    <button onClick={() => setLayersPanelCollapsed(!layersPanelCollapsed)} title={layersPanelCollapsed ? 'Expandir' : 'Recolher'} style={{ padding: '12px 10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#666', marginBottom: '-2px', lineHeight: 1 }}>{layersPanelCollapsed ? '▼' : '▲'}</button>
                </div>

                {!layersPanelCollapsed && (
                    <>
                        <div style={{ padding: '10px 15px', backgroundColor: spatialFilter ? '#FFF5F0' : '#fff', borderBottom: '1px solid #F0F0F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spatialFilter ? 8 : 0 }}>
                                <button onClick={handleDrawingToggle} style={{ padding: '6px 12px', fontSize: 11, backgroundColor: drawingEnabled ? '#D64A12' : '#EC6A2B', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>
                                    {drawingEnabled ? '#D64A12 Parar Desenho' : '✏️ Desenhar Área de Interesse'}
                                </button>
                            </div>
                            {spatialFilter && (
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ fontSize: 11, color: '#D64A12', fontWeight: 'bold', marginBottom: 8, textAlign: 'center', backgroundColor: '#FFF5F0', padding: '4px', borderRadius: 3 }}>✅ Área de filtro ativa - Downloads serão limitados a esta área</div>
                                    <div style={{ fontSize: 10, color: '#666', marginBottom: 8, textAlign: 'center' }}>Selecione uma camada abaixo para baixar apenas os dados desta área</div>
                                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                                        <button onClick={() => { if (drawRef.current) { try { drawRef.current.clear(); } catch (e) { } } setSpatialFilter(null); setDrawingEnabled(false); setTimeout(() => bringDrawLayersToFront(), 50); }} style={{ flex: 1, padding: '4px', fontSize: 10, backgroundColor: '#EF5350', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }}>🗑️ Limpar Área</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {activeLayers.size > 0 && spatialFilter && (
                            <div style={{ padding: '10px', backgroundColor: '#FFF5F0' }}>
                                <div style={{ fontSize: 12, fontWeight: 'bold', color: '#D64A12', marginBottom: 8, textAlign: 'center' }}>🎯 Baixar dados da área selecionada:</div>
                                {activeLayersList.map(layer => (
                                    <div key={layer.name} style={{ padding: '8px', backgroundColor: 'white', marginBottom: 5, borderRadius: 4, border: '2px solid #EC6A2B' }}>
                                        <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5, color: '#3B3B3B' }}>{layer.title}</div>
                                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                            <button onClick={(e) => { e.stopPropagation(); downloadLayerByDraw(layer.name, 'geojson'); }} disabled={downloadingLayer === layer.name} style={{ padding: '4px 8px', fontSize: 9, backgroundColor: '#EC6A2B', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: downloadingLayer === layer.name ? 0.7 : 1, fontWeight: 'bold' }}>{downloadingLayer === layer.name ? '...' : '📦 GeoJSON'}</button>
                                            <button onClick={(e) => { e.stopPropagation(); downloadLayerByDraw(layer.name, 'shapefile'); }} disabled={downloadingLayer === layer.name} style={{ padding: '4px 8px', fontSize: 9, backgroundColor: '#D64A12', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: downloadingLayer === layer.name ? 0.7 : 1, fontWeight: 'bold' }}>{downloadingLayer === layer.name ? '...' : '📦 SHP'}</button>
                                            <button onClick={(e) => { e.stopPropagation(); downloadLayerByDraw(layer.name, 'csv'); }} disabled={downloadingLayer === layer.name} style={{ padding: '4px 8px', fontSize: 9, backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: downloadingLayer === layer.name ? 0.7 : 1, fontWeight: 'bold' }}>{downloadingLayer === layer.name ? '...' : '📦 CSV'}</button>
                                            <button onClick={(e) => { e.stopPropagation(); downloadLayerByDraw(layer.name, 'kml'); }} disabled={downloadingLayer === layer.name} style={{ padding: '4px 8px', fontSize: 9, backgroundColor: '#E91E63', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: downloadingLayer === layer.name ? 0.7 : 1, fontWeight: 'bold' }}>{downloadingLayer === layer.name ? '...' : '📦 KML'}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'selected' && activeLayers.size > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '10px 15px', gap: 6 }}>
                                <button onClick={removeAllLayers} style={{ padding: '4px 12px', fontSize: 11, backgroundColor: '#EF5350', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Remover Todas</button>
                                <button onClick={zoomToAllActiveLayers} style={{ padding: '4px 12px', fontSize: 11, backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }} title="Zoom para a extensão de todas as camadas ativas">🔍 Zoom a Todas</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {!layersPanelCollapsed && (
                <>
                    <div style={{ padding: '10px', borderBottom: '1px solid #F0F0F0' }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#999', pointerEvents: 'none' }}>🔍</span>
                            <input type="text" value={layerSearch} onChange={(e) => setLayerSearch(e.target.value)} placeholder={activeTab === 'selected' ? "Pesquisar camadas selecionadas" : "Pesquisar todas as camadas"} style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 4, border: '1px solid #E0E0E0', fontSize: 12, boxSizing: 'border-box', color: '#3B3B3B' }} />
                            {layerSearch && <button onClick={() => setLayerSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#999', padding: '0 4px' }}>✕</button>}
                        </div>
                        {layerSearch && <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>Mostrando {activeTab === 'selected' ? filteredActiveLayers.length : filteredLayers.length} de {activeTab === 'selected' ? activeLayers.size : layers.length} camadas correspondendo a "{layerSearch}"</div>}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, padding: '10px' }}>
                        {loading && <div style={{ padding: '10px', color: '#666' }}>Carregando camadas...</div>}
                        {error && (
                            <div style={{ padding: '10px' }}>
                                <div style={{ color: '#EF5350', marginBottom: 10, fontSize: 13 }}>{error}</div>
                                <button onClick={() => fetchLayers(baseUrl)} style={{ padding: '8px 15px', backgroundColor: '#EC6A2B', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}>Tentar Novamente</button>
                            </div>
                        )}

                        {!loading && !error && activeTab === 'all' && (
                            <>
                                {filteredLayers.map((layer) => (
                                    <div key={layer.name} style={{ padding: '10px', margin: '5px 0', borderRadius: 6, backgroundColor: activeLayers.has(layer.name) ? '#FFF5F0' : '#F8F8F8', border: activeLayers.has(layer.name) ? '2px solid #EC6A2B' : '1px solid transparent', transition: 'all 0.2s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <input type="checkbox" checked={activeLayers.has(layer.name)} onChange={() => toggleLayer(layer.name)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, fontSize: 13, color: '#3B3B3B' }}>
                                                    {layerSearch ? <span dangerouslySetInnerHTML={{ __html: layer.title.replace(new RegExp(`(${layerSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark style="background-color: #FFF5F0; padding: 0 2px;">$1</mark>') }} /> : layer.title}
                                                </div>
                                                {layer.abstract && <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{layer.abstract.length > 80 ? layer.abstract.substring(0, 80) + '...' : layer.abstract}</div>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, marginLeft: 28, flexWrap: 'wrap' }}>
                                            <button onClick={(e) => { e.stopPropagation(); openAttributeTable(layer.name); }} style={{ padding: '4px 10px', fontSize: 10, backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', fontWeight: 'bold' }}>📊 Abrir Tabela</button>
                                            <button onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'geojson'); }} disabled={downloadingLayer === layer.name} style={{ padding: '4px 10px', fontSize: 10, backgroundColor: '#EC6A2B', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: downloadingLayer === layer.name ? 0.7 : 1 }}>{downloadingLayer === layer.name ? '...' : 'GeoJSON'}</button>
                                            <button onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'shapefile'); }} disabled={downloadingLayer === layer.name} style={{ padding: '4px 10px', fontSize: 10, backgroundColor: '#D64A12', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: downloadingLayer === layer.name ? 0.7 : 1 }}>{downloadingLayer === layer.name ? '...' : 'SHP'}</button>
                                            <button onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'csv'); }} disabled={downloadingLayer === layer.name} style={{ padding: '4px 10px', fontSize: 10, backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: downloadingLayer === layer.name ? 0.7 : 1 }}>{downloadingLayer === layer.name ? '...' : 'CSV'}</button>
                                            <button onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'kml'); }} disabled={downloadingLayer === layer.name} style={{ padding: '4px 10px', fontSize: 10, backgroundColor: '#E91E63', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: downloadingLayer === layer.name ? 0.7 : 1 }}>{downloadingLayer === layer.name ? '...' : 'KML'}</button>
                                        </div>
                                    </div>
                                ))}
                                {filteredLayers.length === 0 && <div style={{ padding: '10px', color: '#666', textAlign: 'center' }}>{layerSearch ? `Nenhuma camada encontrada correspondendo a "${layerSearch}"` : 'Nenhuma camada encontrada'}</div>}
                            </>
                        )}

                        {!loading && !error && activeTab === 'selected' && (
                            <>
                                {activeLayers.size === 0 ? (
                                    <div style={{ padding: '30px 20px', color: '#999', textAlign: 'center' }}>
                                        <div style={{ fontSize: 40, marginBottom: 10 }}>🗺️</div>
                                        <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 5, color: '#3B3B3B' }}>Nenhuma camada selecionada</div>
                                        <div style={{ fontSize: 12 }}>Marque as camadas na aba "Todas as Camadas" para adicioná-las ao mapa</div>
                                    </div>
                                ) : (
                                    <>
                                        {filteredActiveLayers.map((layer) => (
                                            <div key={layer.name} style={{ padding: '12px', margin: '5px 0', borderRadius: 6, backgroundColor: '#FFF5F0', border: '2px solid #EC6A2B', transition: 'all 0.2s' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#EC6A2B', flexShrink: 0 }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: 13, color: '#3B3B3B' }}>
                                                            {layerSearch ? <span dangerouslySetInnerHTML={{ __html: layer.title.replace(new RegExp(`(${layerSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark style="background-color: #FFF5F0; padding: 0 2px;">$1</mark>') }} /> : layer.title}
                                                        </div>
                                                        <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{layer.name}</div>
                                                        {layer.abstract && <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{layer.abstract.length > 80 ? layer.abstract.substring(0, 80) + '...' : layer.abstract}</div>}
                                                    </div>
                                                    <button onClick={() => toggleLayer(layer.name)} style={{ padding: '4px 12px', fontSize: 10, backgroundColor: '#EF5350', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', fontWeight: 'bold' }} title="Remover camada">✕ Remover</button>
                                                </div>
                                                <div style={{ display: 'flex', gap: 4, marginLeft: 14, flexWrap: 'wrap' }}>
                                                    <button onClick={(e) => { e.stopPropagation(); openAttributeTable(layer.name); }} style={{ padding: '4px 10px', fontSize: 10, backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', fontWeight: 'bold' }}>📊 Abrir Tabela</button>
                                                    <button onClick={(e) => { e.stopPropagation(); zoomToLayer(layer.name); }} style={{ padding: '4px 10px', fontSize: 10, backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', fontWeight: 'bold' }} title="Zoom para a extensão da camada">🔍 Zoom</button>
                                                    <button onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'geojson'); }} disabled={downloadingLayer === layer.name} style={{ padding: '4px 10px', fontSize: 10, backgroundColor: '#EC6A2B', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: downloadingLayer === layer.name ? 0.7 : 1 }}>{downloadingLayer === layer.name ? '...' : 'GeoJSON'}</button>
                                                    <button onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'shapefile'); }} disabled={downloadingLayer === layer.name} style={{ padding: '4px 10px', fontSize: 10, backgroundColor: '#D64A12', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: downloadingLayer === layer.name ? 0.7 : 1 }}>{downloadingLayer === layer.name ? '...' : 'SHP'}</button>
                                                    <button onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'csv'); }} disabled={downloadingLayer === layer.name} style={{ padding: '4px 10px', fontSize: 10, backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: downloadingLayer === layer.name ? 0.7 : 1 }}>{downloadingLayer === layer.name ? '...' : 'CSV'}</button>
                                                    <button onClick={(e) => { e.stopPropagation(); downloadLayer(layer.name, 'kml'); }} disabled={downloadingLayer === layer.name} style={{ padding: '4px 10px', fontSize: 10, backgroundColor: '#E91E63', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: downloadingLayer === layer.name ? 0.7 : 1 }}>{downloadingLayer === layer.name ? '...' : 'KML'}</button>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredActiveLayers.length === 0 && layerSearch && <div style={{ padding: '10px', color: '#666', textAlign: 'center' }}>Nenhuma camada selecionada correspondendo a "{layerSearch}"</div>}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};