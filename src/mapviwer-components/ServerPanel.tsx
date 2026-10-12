// src/mapviwer-components/ServerPanel.tsx
import { SERVER_OPTIONS } from './config';
import { LegendBox } from './LegendBox';

interface ServerPanelProps {
    showServerPanel: boolean;
    setShowServerPanel: (val: boolean) => void;
    serverPanelCollapsed: boolean;
    setServerPanelCollapsed: (val: boolean) => void;
    selectedServer: typeof SERVER_OPTIONS[0];
    handleServerChange: (server: typeof SERVER_OPTIONS[0]) => void;
    serverSearch: string;
    setServerSearch: (val: string) => void;
    showDropdown: boolean;
    setShowDropdown: (val: boolean) => void;
    filteredServers: typeof SERVER_OPTIONS;
    customUrl: string;
    setCustomUrl: (val: string) => void;
    handleCustomUrlSubmit: () => void;
    geoserverUrl: string;
    connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
    needsProxy: boolean;
    switchBasemap: (type: 'light' | 'dark' | 'satellite') => void;
    activeBasemap: 'light' | 'dark' | 'satellite';
    isReady: boolean;
    activeLayers: Set<string>;
    baseUrl: string;
    layers: any[];
}

export const ServerPanel = ({
    showServerPanel, setShowServerPanel, serverPanelCollapsed, setServerPanelCollapsed,
    selectedServer, handleServerChange, serverSearch, setServerSearch, showDropdown, setShowDropdown,
    filteredServers, customUrl, setCustomUrl, handleCustomUrlSubmit, geoserverUrl, connectionStatus,
    needsProxy, switchBasemap, activeBasemap, isReady, activeLayers, baseUrl, layers
}: ServerPanelProps) => {

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return '#43A047';
            case 'connecting': return '#FFC107';
            case 'error': return '#E53935';
            default: return '#9E9E9E';
        }
    };

    if (!showServerPanel) {
        return (
            <button onClick={() => setShowServerPanel(true)} style={{ position: 'absolute', top: 80, left: 10, zIndex: 1000, padding: '10px 20px', backgroundColor: '#1976D2', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', fontWeight: 'bold', fontSize: 14 }}>
                ⚙️ Servidores
            </button>
        );
    }

    return (
        <div style={{ position: 'absolute', top: 10, left: 10, width: 350, backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column', maxHeight: '90vh', border: '1px solid #E0E0E0' }}>
            <div style={{ padding: 15, borderBottom: serverPanelCollapsed ? 'none' : '1px solid #F0F0F0', borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: serverPanelCollapsed ? 0 : 10 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 14, color: '#3B3B3B' }}>Configuração do Servidor</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button onClick={() => setServerPanelCollapsed(!serverPanelCollapsed)} title={serverPanelCollapsed ? 'Expandir' : 'Recolher'} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, padding: '0 4px', color: '#666', lineHeight: 1 }}>
                            {serverPanelCollapsed ? '▼' : '▲'}
                        </button>
                        <button onClick={() => setShowServerPanel(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, padding: '0 4px', color: '#666' }}>✕</button>
                    </div>
                </div>

                {!serverPanelCollapsed && (
                    <>
                        <div style={{ position: 'relative', marginBottom: 10 }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#999', pointerEvents: 'none' }}>🔍</span>
                            <input type="text" value={serverSearch} onChange={(e) => { setServerSearch(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} placeholder="Pesquisar servidores" style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 4, border: '1px solid #E0E0E0', fontSize: 12, boxSizing: 'border-box', color: '#3B3B3B' }} />
                        </div>

                        {serverSearch && showDropdown ? (
                            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 10, border: '1px solid #E0E0E0', borderRadius: 4 }}>
                                {filteredServers.map(server => (
                                    <div key={server.label} onClick={() => handleServerChange(server)} style={{ padding: '8px 10px', cursor: 'pointer', fontSize: 12, backgroundColor: selectedServer.label === server.label ? '#E3F2FD' : 'white', borderBottom: '1px solid #F0F0F0' }} onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = '#F5F5F5'; }} onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = selectedServer.label === server.label ? '#E3F2FD' : 'white'; }}>
                                        <div style={{ fontWeight: 500, color: '#3B3B3B' }}>{server.label}</div>
                                        {server.url && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{server.url}</div>}
                                    </div>
                                ))}
                                {filteredServers.length === 0 && <div style={{ padding: '10px', fontSize: 12, color: '#999', textAlign: 'center' }}>Nenhum servidor encontrado</div>}
                            </div>
                        ) : (
                            <select value={selectedServer.label} onChange={(e) => { const server = SERVER_OPTIONS.find(s => s.label === e.target.value); if (server) handleServerChange(server); }} style={{ width: '100%', padding: '8px', marginBottom: 10, borderRadius: 4, border: '1px solid #E0E0E0', boxSizing: 'border-box', color: '#3B3B3B' }}>
                                {SERVER_OPTIONS.map(server => <option key={server.label} value={server.label}>{server.label}</option>)}
                            </select>
                        )}

                        {selectedServer.label === 'Personalizado' && (
                            <div>
                                <input type="text" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="Cole sua URL WMS ou WFS aqui..." style={{ width: '100%', padding: '8px', marginBottom: 5, borderRadius: 4, border: '1px solid #E0E0E0', fontSize: 12, boxSizing: 'border-box', color: '#3B3B3B' }} onKeyPress={(e) => { if (e.key === 'Enter') handleCustomUrlSubmit(); }} />
                                <button onClick={handleCustomUrlSubmit} style={{ width: '100%', padding: '8px', backgroundColor: '#1976D2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Conectar ao Servidor Personalizado</button>
                            </div>
                        )}

                        {geoserverUrl && (
                            <div style={{ marginTop: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#666', wordBreak: 'break-all', padding: '8px', backgroundColor: '#F8F8F8', borderRadius: 4, marginBottom: 5 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: getStatusColor(), flexShrink: 0 }} />
                                    <span>{geoserverUrl}</span>
                                </div>
                                <div style={{ fontSize: 11, color: getStatusColor(), fontWeight: 'bold' }}>
                                    {connectionStatus === 'connected' && `✓ Conectado ${needsProxy ? '(proxy)' : '(direto)'}`}
                                    {connectionStatus === 'connecting' && '⟳ Conectando...'}
                                    {connectionStatus === 'error' && '✗ Falha na conexão'}
                                    {connectionStatus === 'idle' && 'Não conectado'}
                                </div>

                                <div style={{ marginTop: 10 }}>
                                    <div style={{ fontSize: 10, color: '#888', marginBottom: 4, fontWeight: 600, letterSpacing: '0.3px' }}>MAPA BASE</div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => switchBasemap('satellite')} style={{ flex: 1, padding: '6px 4px', fontSize: 11, backgroundColor: activeBasemap === 'satellite' ? '#1976D2' : 'white', color: activeBasemap === 'satellite' ? 'white' : '#3B3B3B', border: '1px solid ' + (activeBasemap === 'satellite' ? '#1976D2' : '#E0E0E0'), borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>🛰️ Satélite</button>
                                        <button onClick={() => switchBasemap('light')} style={{ flex: 1, padding: '6px 4px', fontSize: 11, backgroundColor: activeBasemap === 'light' ? '#1976D2' : 'white', color: activeBasemap === 'light' ? 'white' : '#3B3B3B', border: '1px solid ' + (activeBasemap === 'light' ? '#1976D2' : '#E0E0E0'), borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>☀️ Claro</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {!serverPanelCollapsed && isReady && geoserverUrl && activeLayers.size > 0 && (
                <LegendBox activeLayers={activeLayers} baseUrl={baseUrl} needsProxy={needsProxy} layers={layers} />
            )}
        </div>
    );
};