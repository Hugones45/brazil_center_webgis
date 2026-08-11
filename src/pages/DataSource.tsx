import { useState } from 'react';

// --- ORGANIZED SERVER LIST WITH WEBGIS LINKS ---
// Priority: Direct WebGIS Portal > INDE Visualizador > Official Institutional Website
const SERVER_OPTIONS = [
    { label: 'IDE SISEMA (MG)', url: 'https://visualizador.idesisema.meioambiente.mg.gov.br/' },
    { label: 'EMBRAPA', url: 'https://www.embrapa.br/' }, // Uses institutional site
    { label: 'INPE', url: 'https://terrabrasilis.dpi.inpe.br/' },
    { label: 'IBGE - Malhas Territoriais', url: 'https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html' }, // Uses institutional page
    { label: 'IBGE - CENSO 2022', url: 'https://censo2022.ibge.gov.br/panorama/' },
    { label: 'IBGE - ODS', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'ANATEL', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'ANP', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'ANTT', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'BNDES', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'Censipam', url: 'https://panorama.sipam.gov.br/' },
    { label: 'CPRM / SGB', url: 'https://geoportal.sgb.gov.br/' },
    { label: 'DNIT', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'EPE', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'FUNAI', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'FUNAI/CMR', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'ICA', url: 'https://www2.decea.mil.br/?page_id=149' },
    { label: 'ICMBIO', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'IPHAN', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MB/COMPAAz', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MB/DPC', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MB/DPHDM', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MDIC', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MMA', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MPA', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MPO', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MS/IDE-MS', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MTR', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'MTUR', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'PGGM', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'SPU', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'VALEC', url: 'https://visualizador.inde.gov.br/Ativar?url=https://www.snirh.gov.br/arcgis/services/INDE/Camadas/MapServer/WMSServer' },
    { label: 'DataGeo - São Paulo', url: 'https://datageo.ambiente.sp.gov.br/' },
    { label: 'IDE-GEOBASES (ES)', url: 'https://geobases.es.gov.br/' },
    { label: 'INEA (RJ)', url: 'https://www.inea.rj.gov.br/' },
    { label: 'Prefeitura BH (MG) - BH Map', url: 'https://bhmap.pbh.gov.br/v2/' },
    { label: 'Prefeitura BH (MG) - Geoservicos', url: 'https://geoservicos.pbh.gov.br/' },
    { label: 'PRODEMG (MG)', url: 'https://www.prodemge.mg.gov.br/' },
    { label: 'SEMACE (CE)', url: 'https://www.semace.ce.gov.br/' },
    { label: 'SEPLAN (TO)', url: 'https://www.to.gov.br/seplan/' },
    { label: 'INDE Catalog', url: 'https://www.inde.gov.br/' },
    { label: 'MapBiomas Alerta', url: 'https://alerta.mapbiomas.org/' },
    { label: 'UFABC', url: 'https://www.ufabc.edu.br/' },
];

const DataSource = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredServers = SERVER_OPTIONS.filter(server =>
        server.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{
            padding: '30px',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(26, 35, 126, 0.02) 0%, transparent 50%)',
            boxSizing: 'border-box'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1400px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '80vh',
            }}>

                {/* Top Header Area */}
                <div style={{
                    backgroundColor: '#1C2E4A',
                    padding: '24px 30px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    flexShrink: 0
                }}>
                    <div>
                        <h2 style={{
                            color: '#ffffff',
                            margin: 0,
                            fontSize: '20px',
                            fontWeight: 600,
                            letterSpacing: '0.5px'
                        }}>
                            🗺️ Catálogo de Fontes de Dados
                        </h2>
                        <p style={{
                            color: '#9aaec9',
                            margin: '4px 0 0 0',
                            fontSize: '13px'
                        }}>
                            Visualize os serviços geoespaciais disponíveis e suas origens no WebGIS
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <span style={{
                                position: 'absolute',
                                left: '12px',
                                color: '#9aaec9',
                                fontSize: '14px'
                            }}>
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar serviço..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '8px 12px 8px 36px',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontSize: '14px',
                                    width: '220px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#ffffff'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                            />
                        </div>

                        <div style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            whiteSpace: 'nowrap'
                        }}>
                            {filteredServers.length} Serviços Carregados
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div style={{
                    padding: '20px 30px 40px 30px',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                    }}>
                        <thead>
                            <tr style={{
                                borderBottom: '2px solid #e5e7eb'
                            }}>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '14px 16px',
                                    fontWeight: 600,
                                    color: '#1C2E4A',
                                    textTransform: 'uppercase',
                                    fontSize: '12px',
                                    letterSpacing: '1px',
                                    width: '35%'
                                }}>
                                    Serviço
                                </th>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '14px 16px',
                                    fontWeight: 600,
                                    color: '#1C2E4A',
                                    textTransform: 'uppercase',
                                    fontSize: '12px',
                                    letterSpacing: '1px'
                                }}>
                                    Fonte (Link WebGIS)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredServers.length > 0 ? (
                                filteredServers.map((server, index) => (
                                    <tr
                                        key={index}
                                        style={{
                                            borderBottom: '1px solid #f3f4f6',
                                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                                            transition: 'background-color 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f4fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafbfc'}
                                    >
                                        <td style={{
                                            padding: '14px 16px',
                                            color: '#374151',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}>
                                            <span style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: '#4ade80',
                                                display: 'inline-block',
                                                flexShrink: 0
                                            }} />
                                            {server.label}
                                        </td>
                                        <td style={{
                                            padding: '14px 16px',
                                            color: '#6b7280',
                                            fontFamily: 'monospace',
                                            fontSize: '13px'
                                        }}>
                                            {server.url ? (
                                                <a
                                                    href={server.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-block',
                                                        backgroundColor: '#4ade80',
                                                        color: '#14532d',
                                                        padding: '6px 16px',
                                                        borderRadius: '20px',
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                        textDecoration: 'none',
                                                        boxShadow: '0 2px 4px rgba(74, 222, 128, 0.3)',
                                                        transition: 'all 0.2s ease',
                                                        cursor: 'pointer',
                                                        border: '1px solid transparent'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        const target = e.target as HTMLAnchorElement;
                                                        target.style.backgroundColor = '#22c55e';
                                                        target.style.transform = 'translateY(-1px)';
                                                        target.style.boxShadow = '0 4px 8px rgba(74, 222, 128, 0.4)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        const target = e.target as HTMLAnchorElement;
                                                        target.style.backgroundColor = '#4ade80';
                                                        target.style.transform = 'translateY(0px)';
                                                        target.style.boxShadow = '0 2px 4px rgba(74, 222, 128, 0.3)';
                                                    }}
                                                >
                                                    Acessar WebGIS ↗
                                                </a>
                                            ) : (
                                                <span style={{
                                                    display: 'inline-block',
                                                    border: '1px dashed #d1d5db',
                                                    padding: '4px 12px',
                                                    borderRadius: '4px',
                                                    color: '#9ca3af',
                                                    fontSize: '12px'
                                                }}>
                                                    — link placeholder —
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} style={{
                                        padding: '40px',
                                        textAlign: 'center',
                                        color: '#6b7280',
                                        fontSize: '14px'
                                    }}>
                                        Nenhum serviço encontrado para "<strong>{searchTerm}</strong>"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Simple Footer */}
                <div style={{
                    padding: '16px 30px',
                    borderTop: '1px solid #f3f4f6',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    color: '#6b7280',
                    fontSize: '12px',
                    flexShrink: 0
                }}>
                    Desenvolvido com dados GeoServer OWS
                </div>
            </div>
        </div>
    );
};

export default DataSource;